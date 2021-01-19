
var mongoose = require( 'mongoose' );
var _ = require( 'lodash' );

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );

var DocumentType = mongoose.model( 'DocumentType' );

var _this = this;

exports.handleError = function( err, req, res ){
    return util.handleError( 'document-type', err, req, res );
};






exports.get = function( req, res, next ){
    DocumentType.find( {}, null, { sort: { order: 'desc' } }, function( err, result ){
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

