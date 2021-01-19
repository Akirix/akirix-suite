var _ = require( 'lodash' );
var bcrypt = require( 'bcryptjs' );
var moment = require( 'moment-timezone' );
var uberDb = require( '../models_uber' );
var platformDb = require( '../models' );
var signupDb = require( '../models_signup' );
var UberCompanySetting = uberDb.UberCompanySetting;

var logger = require( '../lib/akx.logger.js' );
var notifier = require( '../lib/akx.notifier.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'company', err, req, res );
};

exports.index = function( req, res, next ){
    var whereCond = [];

    if( !_.isEmpty( req.params.company_id ) ){
        whereCond.push(
            { company_id: req.params.company_id }
        );
    }

    if( _.isEmpty( req.validationErrors ) ){
        UberCompanySetting.findAndCountAll( {
            where: whereCond
        } )
            .then( function( uberCompanySettings ){
                res.send( 200, { uberCompanySettings: uberCompanySettings.rows } );
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
