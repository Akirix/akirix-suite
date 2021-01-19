var AccountAlias = require( '../models' ).AccountAlias;
var util = require( '../lib/akx.util.js' );
var transports = require( '../config/config.json' ).akxLogger.transports;
var currentFileName = __filename.split( '/' ).pop();
var akxLogger = require( 'logger' )( currentFileName, transports );

exports.handleError = function( err, req, res ){
    util.handleError( 'account', err, req, res );
};



exports.index = function( req, res, next ){

    AccountAlias.findAll( {
        where: {
            company_id: req.user.company_id,
            status: 1
        }
    } ).then( function( aliases ){
        if( !aliases ){
            res.send( 200, [] );
            return next();
        }
        else{
            res.send( 200, { accountAliases: aliases } );
            return next();
        }
    } ).catch( function( err ){
        return util.handleLibError( err, req, res, akxLogger )
    } );
};