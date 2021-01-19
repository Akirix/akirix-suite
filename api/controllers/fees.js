
var Sequelize = require( 'sequelize' );
var Globalize = require( 'globalize' );
var moment = require( 'moment-timezone' );
var db = require( '../models' );
var _ = require( 'lodash' );
var Hashids = require( "hashids" );

var Fee = db.Fee;
var Company = db.Company;

var notifier = require( '../lib/akx.notifier.js' );
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;



exports.handleError = function( err, req, res ){
    util.handleError( 'ticket', err, req, res );
};
exports.index = function( req, res, next ){

    Fee.findAll( {
        where: {
            company_id: req.user.company_id
        }
    } ).done( function( err, fees ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else if( !fees ){
            res.send( 200, { fees: [] } );
            return next();
        }
        else{
            res.send( 200, { fees: fees } );
            return next();
        }
    } )
};


