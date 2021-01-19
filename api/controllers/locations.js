




var db = require( '../models' );
var _ = require( 'lodash' );

var Location = db.Location;

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