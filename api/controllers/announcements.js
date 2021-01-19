



var db = require( '../models' );
var moment = require( 'moment-timezone' );
var Announcement = db.Announcement;
var util = require( '../lib/akx.util.js' );
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'announcement', err, req, res );
};





exports.index = function( req, res, next ){
    Announcement.findAll( {
            where: {
                publish_from: {
                    lte: moment.utc().format()
                },
                publish_to: {
                    gte: moment.utc().format()
                }
            }
        } )
        .done( function( err, announcements ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                res.send( 200, { announcements: announcements } );
                return next();
            }
        } );
}
