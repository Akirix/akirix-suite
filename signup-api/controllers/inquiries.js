
var mongoose = require( 'mongoose' );
var _ = require( 'lodash' );

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );

var Inquiry = mongoose.model( 'Inquiry' );

var _this = this;

exports.handleError = function( err, req, res ){
    return util.handleError( 'inquiry', err, req, res );
};






exports.get = function( req, res, next ){
    Inquiry.find( {}, null, null, function( err, result ){
        if( err ){
            _this.handleError( err, req, res );
            return next();
        }
        else{
            res.send( 200, result );
            return next();
        }
    } );
};

