var _ = require( 'lodash' );
var kebabCase = require( 'lodash.kebabcase' );
var camelCase = require( 'lodash.camelcase' );
var bcrypt = require( 'bcryptjs' );
var moment = require( 'moment-timezone' );
var uberDb = require( '../models_uber' );
var platformDb = require( '../models' );
var signupDb = require( '../models_signup' );
var UberTask = uberDb.UberTask;

var logger = require( '../lib/akx.logger.js' );
var notifier = require( '../lib/akx.notifier.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'user', err, req, res );
};

exports.index = function( req, res, next ){
    var query = {
        where: {},
        order: [
            [ 'updated_at', 'DESC' ]
        ]
    };

    req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
    req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );

    var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
    if( paged ){
        query[ 'offset' ] = ( req.params.page - 1 ) * req.params.per_page;
        query[ 'limit' ] = req.params.per_page;
    }

    var validFields = [ 'model_id', 'company_id', 'uber_user_id' ];
    _.forEach( validFields, function( field ){
        if( _.has( req.params, field ) ){
            query.where[ field ] = req.params[ field ];
        }
    } );

    if( !_.isEmpty( req.params.type ) ){
        query.where[ 'type' ] = req.params.type;

        if( req.params.type === '0' || req.params.type === 0 ){
            if( !_.isEmpty( req.params.due_date ) ){
                query.where[ 'due_date' ] = { lte: moment( req.params.due_date ).utc().format( 'YYYY-MM-DD' + ' 23:59:59' ) };
                query.where[ 'status' ] = [ 0, 1 ];
            }

            if( !_.isEmpty( req.params.status ) ){
                query.where[ 'status' ] = req.params.status;
            }
        }
    }

    if( !_.isEmpty( req.params.model ) ){
        query.where[ 'model' ] = [ req.params.model, kebabCase( req.params.model ), camelCase( req.params.model ) ]
    }

    if( _.isEmpty( req.validationErrors ) ){
        UberTask.findAndCountAll( query )
            .then( function( uberTasks ){
                var totalPages = 1;
                if( paged ){
                    var pageRatio = uberTasks.count / req.params.per_page;
                    totalPages = Math.floor( pageRatio );
                    if( pageRatio % 1 > 0 ){
                        totalPages++;
                    }
                }

                res.send( 200, { uberTasks: uberTasks.rows, meta: { total_pages: totalPages } } );
                return next();
            } )
            .catch( function( err ){
                _this.handleError( err, req, res );
                return next();
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.view = function( req, res, next ){
    req.assert( 'uber_task_id', 'isString' );

    var whereCond = [
        { id: req.params.uber_task_id }
    ];


    if( _.isEmpty( req.validationErrors ) ){
        UberTask.find( {
            where: whereCond
        } )
            .then( function( uberTask ){
                res.send( 200, { uberTask: uberTask } );
                return next();
            } )
            .catch( function( err ){
                _this.handleError( err, req, res );
                return next();
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.create = function( req, res, next ){

    req.assert( 'uberTask', 'isObject' );
    req.assert( 'uberTask.type', 'isIn', [ 0, 1, 2 ] );

    if( _.isEmpty( req.validationErrors ) ){

        var validKeys = _.union( [ 'Registration' ], Object.keys( uberDb ), Object.keys( platformDb ) );
        validKeys = _.union( validKeys, validKeys.map( kebabCase ), validKeys.map( camelCase ) );

        var models = _.filter( validKeys, function( value ){
            return value.toLowerCase() !== 'sequelize';
        } );

        if( _.isString( req.params.uberTask.model ) && _.indexOf( models, req.params.uberTask.model ) === -1 ){
            res.send( 400, {
                errors: [
                    { model: [ 'Invalid model' ] }
                ]
            } );

            return next();
        }
        else{
            var newTask = {
                type: req.params.uberTask.type,
                status: 0 // Not Started
            };

            // Set note's status to 2 always
            if( req.params.uberTask.type === 1 ){
                newTask.status = 2;
                newTask.uber_user_id = req.user.id;
            }

            var validiationFields = [
                { field: 'company_id', validation: _.isString },
                { field: 'uber_user_id', validation: _.isString },
                { field: 'model', validation: _.isString },
                { field: 'model_id', validation: _.isString },
                { field: 'title', validation: _.isString },
                { field: 'notes_new', validation: _.isString },
                { field: 'due_date', validation: _.isString },
                { field: 'sentiment', validation: _.isNumber },
                { field: 'priority', validation: _.isNumber },
                {
                    field: 'status', validation: function( value ){
                    return _.indexOf( [ 0, 1, 2 ], value ) !== -1;
                }
                }
            ];

            _.forEach( validiationFields, function( item ){
                if( item.validation( req.params.uberTask[ item.field ] ) ){
                    newTask[ item.field ] = req.params.uberTask[ item.field ];
                }
            } );

            var notesContent = ''
            if( req.params.uberTask.notes ){
                notesContent += req.params.uberTask.notes;
            }

            if( newTask.notes_new ){
                notesContent += newTask.notes_new;
            }

            newTask.notes = req.user.name + ' @ ' + moment().format( 'YYYY-MM-DD HH:mm:ss' ) + "\n" + notesContent;

            UberTask.create( newTask )
                .then( function( uberTask ){
                    res.send( 201, { uberTask: uberTask } );
                    return next();
                } )
                .catch( function( err ){
                    _this.handleError( err, req, res );
                    return next();
                } );
        }
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.update = function( req, res, next ){

    req.assert( 'uberTask', 'isObject' );
    req.assert( 'uber_task_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        var validKeys = _.union( [ 'Registration' ], Object.keys( uberDb ), Object.keys( platformDb ) );
        validKeys = _.union( validKeys, validKeys.map( kebabCase ), validKeys.map( camelCase ) );

        var models = _.filter( validKeys, function( value ){
            return value.toLowerCase() !== 'sequelize' && value.toLowerCase() !== 'Sequelize';
        } );

        UberTask.find( {
            where: [
                { id: req.params.uber_task_id }
            ]
        } )
            .then( function( uberTask ){
                if( _.isEmpty( uberTask ) ){
                    res.send( 400, {
                        errors: [
                            'Cannot find task'
                        ]
                    } );

                    return next();
                }
                else{
                    if( _.isString( req.params.uberTask.model ) && _.indexOf( models, req.params.uberTask.model ) === -1 ){
                        res.send( 400, {
                            errors: [
                                { model: [ 'Invalid model' ] }
                            ]
                        } );

                        return next();
                    }
                    else{

                        var validiationFields = [
                            { field: 'company_id', validation: _.isString },
                            { field: 'uber_user_id', validation: _.isString },
                            { field: 'model', validation: _.isString },
                            { field: 'model_id', validation: _.isString },
                            { field: 'title', validation: _.isString },
                            //{ field: 'notes', validation: _.isString },
                            { field: 'sentiment', validation: _.isNumber },
                            { field: 'priority', validation: _.isNumber },
                            {
                                field: 'status', validation: function( value ){
                                return _.indexOf( [ 0, 1, 2 ], value ) !== -1;
                            }
                            },
                            {
                                field: 'due_date', validation: function( value ){
                                return value !== null && typeof value !== 'undefined' && moment( value ).isValid();
                            }
                            }
                        ];

                        _.forEach( validiationFields, function( item ){
                            if( item.validation( req.params.uberTask[ item.field ] ) ){
                                uberTask[ item.field ] = req.params.uberTask[ item.field ];
                            }
                        } );

                        if( _.isString( req.params.uberTask.notes_new ) && !_.isEmpty( req.params.uberTask.notes_new ) ){
                            uberTask.notes = req.user.name + ' @ ' + moment().format( 'YYYY-MM-DD HH:mm:ss' ) + "\n" + req.params.uberTask.notes_new + "\n\n" + uberTask.notes;
                        }

                        uberTask.save()
                            .then( function( updatedUberTask ){
                                var returnValue = updatedUberTask.toJSON();
                                uberTask.values[ 'notes_new' ] = null;

                                res.send( 200, { uberTask: uberTask } );
                                return next();
                            } )
                            .catch( function( err ){
                                _this.handleError( err, req, res );
                                return next();
                            } );
                    }
                }
            } )
            .catch( function( err ){
                _this.handleError( err, req, res );
                return next();
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};
