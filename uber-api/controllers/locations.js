




var Sequelize = require( 'sequelize' );
var Globalize = require( 'globalize' );
var moment = require( 'moment-timezone' );
var db = require( '../models' );
var _ = require( 'lodash' );
var Hashids = require( "hashids" );

var Location = db.Location;


var notifier = require( '../lib/akx.notifier.js' );
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;



exports.handleError = function( err, req, res ){
    util.handleError( 'location', err, req, res );
};





exports.index = function( req, res, next ){
    var query = {
        where: {},
        order: [
            [ 'name', 'ASC' ]
        ]
    };

    var validFields = [ 'type', 'status' ];
    _.forEach( validFields, function( field ){
        if( _.has( req.params, field ) ){
            query.where[ field ] = req.params[ field ];
        }
    } );
    Location.findAll( query ).then( function( locations ){
        res.send( 200, { locations: locations } );
        return next();
    } ).catch( function( err ){
        _this.handleError( err, req, res );
        return next();
    } );
};
