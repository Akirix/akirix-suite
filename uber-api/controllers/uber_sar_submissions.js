

var Sequelize = require( 'sequelize' );
var db = require( '../models' );
var uberDb = require( '../models_uber' );
var _ = require( 'lodash' );
var request = require( 'request' );

var UberSARSubmission = uberDb.UberSARSubmission;

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var notifier = require( '../lib/akx.notifier.js' );
var _this = this;


exports.handleError = function( err, req, res ){
    util.handleError( 'uber_sar_submission', err, req, res );
};


exports.index = function( req, res, next ){

    var query = {
        where: [],
        order: [
            [ 'created_at', 'DESC' ]
        ]
    };

    if( !_.isEmpty( req.params.uber_sar_report_id ) ){
        query.where.push( { uber_sar_report_id: req.params.uber_sar_report_id } );
    }

    UberSARSubmission.findAll( query )
        .then( function( uberSarSubmissions ){


            res.send( 200, { uberSarSubmission: uberSarSubmissions} );
            return next();

        } ).catch( function( err ){
        _this.handleError( err, req, res );
        return next();
    } )

};

exports.view = function( req, res, next ){
    req.assert( 'uber_sar_submission_id', 'isString' );

    var whereCond = [
        { id: req.params.uber_sar_submission_id }
    ];


    if( _.isEmpty( req.validationErrors ) ){
        UberSARSubmission.find( {
            where: whereCond
        } )
            .then( function( uberSarSubmission ){
                res.send( 200, { uberSarSubmission: uberSarSubmission } );
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

    req.assert( 'uberSarSubmission', 'isObject' );
    req.assert( 'uberSarSubmission.uber_sar_report_id', 'isString' );
    req.assert( 'uberSarSubmission.status', 'isNumber' );
    req.assert( 'uberSarSubmission.type', 'isNumber' );

    if( _.isEmpty( req.validationErrors ) ){

        UberSARSubmission.create( req.params.uberSarSubmission )
            .then( function( uberSARSubmission ){
                res.send( 201, { uberSarSubmission: uberSARSubmission } );
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


exports.update = function( req, res, next ){

    req.assert( 'uberSarSubmission', 'isObject' );
    req.assert( 'uber_sar_submission_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        UberSARSubmission.find( {
            where: [
                { id: req.params.uber_sar_submission_id }
            ]
        } )
            .then( function( uberSarSubmission ){
                if( _.isEmpty( uberSarSubmission ) ){
                    res.send( 400, {
                        errors: [
                            'Cannot find submission'
                        ]
                    } );
                    return next();
                }

                if( uberSarSubmission.status === 3 ){
                    res.send( 400, {
                        errors: [
                            'Cannot update completed submission'
                        ]
                    } );
                    return next();
                }
                else{

                    var validiationFields = [
                        { field: 'status', validation: _.isNumber },
                        { field: 'confirmation', validation: _.isString },
                        { field: 'reference', validation: _.isString }
                    ];

                    _.forEach( validiationFields, function( item ){
                        if( item.validation( req.params.uberSarSubmission[ item.field ] ) ){
                            uberSarSubmission[ item.field ] = req.params.uberSarSubmission[ item.field ];
                        }
                    } );


                    uberSarSubmission.save()
                        .then( function( updateduUerSarSubmission ){
                            res.send( 200, { uberSarSubmission: updateduUerSarSubmission } );
                            return next();
                        } )
                        .catch( function( err ){
                            _this.handleError( err, req, res );
                            return next();
                        } );


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
