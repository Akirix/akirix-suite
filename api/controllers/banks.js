var db = require( '../models' );
var Bank = db.Bank;
var _ = require( 'lodash' );
var transports = require( '../config/config.json' ).akxLogger.transports;
var util = require( '../lib/akx.util.js' );
var currentFileName = __filename.split( '/' ).pop();
var akxLogger = require( 'logger' )( currentFileName, transports );


exports.index = function( req, res, next ){
    var query = {
        where: [],
        limit: 50,
        order: 'id ASC'
    };


    if( !_.isEmpty( req.params.id ) ){
        query.where.push( { id: { like: '%' + req.params.id + '%' } } );
    }

    if( !_.isEmpty( req.params.name ) ){
        query.where.push( { name: { like: '%' + req.params.name + '%' } } );
    }

    if( _.isEmpty( query.where ) ){
        query.where = {};
    }

    Bank.findAll( query ).then( function( banks ){
        res.send( 200, { banks: banks } );
        return next();
    } ).catch( function( err ){
        return util.handleLibError( err, req, res, akxLogger );
    } );
};