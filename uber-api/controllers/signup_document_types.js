var mongoose = require( 'mongoose' );
var _ = require( 'lodash' );

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );

var signupDocumentType = mongoose.model( 'DocumentType' );

var _this = this;

exports.handleError = function( err, req, res ){
    return util.handleError( 'onboarding', err, req, res );
};

exports.index = function( req, res, next ){
    signupDocumentType.find( {}, null, { sort: { order: 'asc' } }, function( err, documentTypes ){
        if( err ){
            _this.handleError( err, req, res );
            return next();
        }
        else{
            res.send( 200, { documentTypes: documentTypes } );
            return next();
        }
    } );
};