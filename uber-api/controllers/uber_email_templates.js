var _ = require( 'lodash' );
var uberDb = require( '../models_uber' );
var platformDb = require( '../models' );
var UberEmailTemplate = uberDb.UberEmailTemplate;

var kebabCase = require( 'lodash.kebabcase' );
var camelCase = require( 'lodash.camelcase' );
var logger = require( '../lib/akx.logger.js' );
var notifier = require( '../lib/akx.notifier.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'uber_email_template', err, req, res );
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

    var validFields = [ 'model', 'name', 'subject' ];
    _.forEach( validFields, function( field ){
        if( _.has( req.params, field ) ){
            query.where[ field ] = req.params[ field ];
        }
    } );

    if( !_.isEmpty( req.params.model ) ){
        if( req.params.model === 'null' ){
            query.where[ 'model' ] = null;
        }
        else{
            query.where[ 'model' ] = [ req.params.model, kebabCase( req.params.model ), camelCase( req.params.model ) ]
        }
    }

    if( _.isEmpty( req.validationErrors ) ){
        UberEmailTemplate.findAndCountAll( query )
            .then( function( uberEmailTemplates ){
                var totalPages = 1;
                if( paged ){
                    var pageRatio = uberEmailTemplates.count / req.params.per_page;
                    totalPages = Math.floor( pageRatio );
                    if( pageRatio % 1 > 0 ){
                        totalPages++;
                    }
                }

                res.send( 200, { uberEmailTemplates: uberEmailTemplates.rows, meta: { total_pages: totalPages } } );
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
    req.assert( 'uber_email_template_id', 'isString' );

    var whereCond = [
        { id: req.params.uber_email_template_id }
    ];

    if( _.isEmpty( req.validationErrors ) ){
        UberEmailTemplate.find( {
            where: whereCond
        } ).then( function( uberEmailTemplate ){
            if( !uberEmailTemplate ){
                res.send( 404, {
                    errors: [
                        'Cannot find template'
                    ]
                } );

                return next();
            }
            else{
                res.send( 200, { uberEmailTemplate: uberEmailTemplate } );
                return next();
            }
        } ).catch( function( err ){
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
    req.assert( 'uberEmailTemplate', 'isObject' );
    req.assert( 'uberEmailTemplate.name', 'isString' );
    req.assert( 'uberEmailTemplate.subject', 'isString' );
    req.assert( 'uberEmailTemplate.content', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        var validKeys = _.union( [ 'Registration' ], Object.keys( uberDb ), Object.keys( platformDb ) );
        validKeys = _.union( validKeys, validKeys.map( kebabCase ), validKeys.map( camelCase ) );

        var models = _.filter( validKeys, function( value ){
            return value.toLowerCase() !== 'sequelize' && value.toLowerCase() !== 'Sequelize';
        } );

        if( _.isString( req.params.uberEmailTemplate.model ) && _.indexOf( models, req.params.uberEmailTemplate.model ) === -1 ){
            res.send( 400, {
                errors: [
                    [ 'Invalid model' ]
                ]
            } );

            return next();
        }
        else{
            var newUberEmailTempate = {
                subject: req.params.uberEmailTemplate.subject,
                name: req.params.uberEmailTemplate.name,
                model: req.params.uberEmailTemplate.model || null,
                content: req.params.uberEmailTemplate.content,
                email: req.params.uberEmailTemplate.email
            };

            UberEmailTemplate.create( newUberEmailTempate )
                .then( function( newUberEmailTempate ){
                    res.send( 201, { uberEmailTemplate: newUberEmailTempate } );
                    logger.info( 'uber-email-template', 'New Uber Email Template has been created', {
                        req: req,
                        model: 'uber-email-template',
                        model_id: newUberEmailTempate.id
                    } );
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
    req.assert( 'uberEmailTemplate', 'isObject' );
    req.assert( 'uberEmailTemplate.name', 'isString' );
    req.assert( 'uberEmailTemplate.subject', 'isString' );
    //req.assert( 'uberEmailTemplate.model', 'isString' );
    req.assert( 'uberEmailTemplate.content', 'isString' );
    req.assert( 'uber_email_template_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        var validKeys = _.union( [ 'Registration' ], Object.keys( uberDb ), Object.keys( platformDb ) );
        validKeys = _.union( validKeys, validKeys.map( kebabCase ), validKeys.map( camelCase ) );

        var models = _.filter( validKeys, function( value ){
            return value.toLowerCase() !== 'sequelize' && value.toLowerCase() !== 'Sequelize';
        } );

        UberEmailTemplate.find( {
            where: [
                { id: req.params.uber_email_template_id }
            ]
        } )
            .then( function( uberEmailTemplate ){
                if( _.isEmpty( uberEmailTemplate ) ){
                    res.send( 404, {
                        errors: [
                            'Cannot find template'
                        ]
                    } );

                    return next();
                }
                else{
                    if( _.isString( req.params.uberEmailTemplate.model ) && _.indexOf( models, req.params.uberEmailTemplate.model ) === -1 ){
                        res.send( 400, {
                            errors: [
                                { model: [ 'Invalid model' ] }
                            ]
                        } );

                        return next();
                    }
                    else{

                        var validiationFields = [
                            { field: 'subject', validation: _.isString },
                            { field: 'name', validation: _.isString },
                            { field: 'content', validation: _.isString },
                            { field: 'email', validation: _.isString },
                            { field: 'model', validation: _.isString }
                        ];

                        _.forEach( validiationFields, function( item ){
                            if( req.params.uberEmailTemplate[ item.field ] && item.validation( req.params.uberEmailTemplate[ item.field ] ) ){
                                uberEmailTemplate[ item.field ] = req.params.uberEmailTemplate[ item.field ];
                            }
                        } );

                        return uberEmailTemplate.save()
                            .then( function( updatedUberEmailTemplate ){
                                res.send( 200, { uberEmailTemplate: updatedUberEmailTemplate } );
                                logger.info( 'uber-email-template', 'Uber Email Template has been updated', {
                                    req: req,
                                    model: 'uber-email-template',
                                    model_id: updatedUberEmailTemplate.id
                                } );
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






exports.delete = function( req, res, next ){
    req.assert( 'uber_email_template_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        UberEmailTemplate.find( {
            where: {
                id: req.params.uber_email_template_id
            }
        } ).then( function( foundTemplate ){
            if( _.isEmpty( foundTemplate ) ){
                res.send( 404, {
                    errors: [
                        'Cannot find template'
                    ]
                } );

                return next();
            }
            else{
                return foundTemplate.destroy().then( function(){
                    res.send( 200, { uberEmailTemplate: foundTemplate } );
                    logger.info( 'uber-email-template', 'Uber Email Template has been removed', {
                        req: req,
                        model: 'uber-email-template',
                        model_id: req.params.uber_email_template_id
                    } );
                    return next();
                } );
            }
        } ).catch( function( err ){
            _this.handleError( err, req, res );
            return next();
        } );

    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};