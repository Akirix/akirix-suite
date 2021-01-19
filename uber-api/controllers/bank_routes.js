var db = require( '../models' );
var _ = require( 'lodash' );
var moment = require( 'moment-timezone' );

var BankRoute = db.BankRoute;
var util = require('../lib/akx.util.js')

var transports = require( '../config/config.json' ).akxLogger.transports;
var currentFileName = __filename.split( '/' ).pop();
var akxLogger = require( 'logger' )( currentFileName, transports );
var akxStrings = require( 'akx-strings' )();
var _this = this;

exports.index = function( req, res, next ){
    BankRoute.findAll( {
        order: [
            [ 'name', 'ASC' ]
        ]
    } ).then( function( bankRoutes ){
        res.send( 200, { bankRoutes: bankRoutes } );
        return next();
    } ).catch( function( err ){
        return util.handleLibError( err, req, res, akxLogger );
    } );
};


exports.view = function( req, res, next ){
    BankRoute.find( {
        where: {
            id: req.params.bank_route_id
        }
    } ).then( function( bankRoute ){
        if( !bankRoute ){
            return res.send( 404 );
        }
        else{
            res.send( 200, { bankRoute: bankRoute } );
            return next();
        }
    } ).catch( function( err ){
        return util.handleLibError( err, req, res, akxLogger );
    } );
};