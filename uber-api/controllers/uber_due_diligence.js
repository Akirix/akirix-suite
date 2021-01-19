var Sequelize = require( 'sequelize' );
var _ = require( 'lodash' );
var fs = require( 'fs' );

var uberDb = require( '../models_uber' );
var db = require( '../models' );
var Company = db.Company;
var Wire = db.Wire;
var UberDueDiligence = uberDb.UberDueDiligence;

var notifier = require( '../lib/akx.notifier.js' );
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

exports.index = function( req, res, next ){
    var query = {
        where: {},
        order: [
            [ 'status', 'ASC' ],
            [ 'updated_at', 'DESC' ]
        ]
    };

    var validFields = [ 'company_id' ];
    _.forEach( validFields, function( field ){
        if( _.has( req.params, field ) ){
            query.where[ field ] = req.params[ field ];
        }
    } );

    UberDueDiligence.findAll( query )
        .done( function( err, dds ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                res.send( 200, { uberDueDiligences: dds } );
                return next();
            }
        } );
};

exports.view = function( req, res, next ){

    req.assert( 'uber_uber_due_diligence_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        UberDueDiligence.find( {
                where: {
                    id: req.params.uber_uber_due_diligence_id
                }
            } )
            .done( function( err, dd ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{
                    res.send( 200, { UberDueDiligences: dd } );
                    return next();
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};


exports.create = function( req, res, next ){

    req.assert( 'uberDueDiligence', 'isObject' );
    req.assert( 'uberDueDiligence.company_id', 'isString' );
    req.assert( 'uberDueDiligence.options', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Company.find( {
                where: {
                    id: req.params.uberDueDiligence.company_id
                }
            } )
            .done( function( err, company ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !company ){
                    res.send( 400, { errors: [ 'Invalid company_id' ] } );
                    return next();
                }
                else{
                    var newDd = UberDueDiligence.build( {
                        company_id: req.params.uberDueDiligence.company_id,
                        options: req.params.uberDueDiligence.options,
                        uber_user_id: req.user.id,
                        status: 0
                    } );
                    newDd.save()
                        .done( function( err ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else{
                                res.send( 201, { UberDueDiligences: newDd } );
                                logger.info( 'uber-due-diligence', 'New due diligence created for company [' + req.params.uberDueDiligence.company_id + ']', {
                                    req: req,
                                    model: 'uber-due-diligence',
                                    model_id: newDd.id
                                } );
                                return next();
                            }
                        } );
                }

            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};


exports.download = function( req, res, next ){

    req.assert( 'uber_due_diligence_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        UberDueDiligence.find( {
                where: {
                    id: req.params.uber_due_diligence_id
                },
            } )
            .done( function( err, dd ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !dd ){
                    res.send( 404 );
                    logger.error( 'uber-due-diligence', 'No due diligence found with id [' + req.params.uber_due_diligence_id + ']', {
                        req: req
                    } );
                    return next();
                }
                else{
                    Company.find( dd.company_id ).done( function( err, company ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else if( !company ){
                            res.send( 404 );
                            return next();
                        }
                        else{
                            var path = __dirname + "/../documents/uber-due-diligence/" + dd.id;
                            res.setHeader( 'Content-disposition', 'attachment; filename="XYZ' + company.account_number + ' ' + company.name + '.zip"' );
                            res.setHeader( 'Content-type', 'application/zip, application/octet-stream' );
                            var filestream = fs.createReadStream( path );
                            filestream.pipe( res );

                            filestream.on( 'end', function(){
                                logger.info( 'uber-due-diligence', 'Due diligence downloaded for company [' + company.id + ']', {
                                    req: req,
                                    model: 'uber-due-diligence',
                                    model_id: dd.id
                                } );
                                return next();
                            } );
                        }
                    } );
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};