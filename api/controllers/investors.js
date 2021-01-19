

var db = require( '../models' );
var _ = require( 'lodash' );

var Company = db.Company;
var User = db.User;

var notifier = require( '../lib/akx.notifier.js' );
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;



exports.handleError = function( err, req, res ){
    util.handleError( 'company', err, req, res );
};





exports.view = function( req, res, next ){

    req.assert( 'company_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        Company.find( {
            where: {
                id: req.params.company_id
            }
        } )
            .done( function( err, company ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !company ){
                    res.send( 404 );
                    return next();
                }
                else{
                    res.send( 200, { investor: company } );
                    return next();
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};