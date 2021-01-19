var _ = require( 'lodash' );
var moment = require( 'moment-timezone' );
var mongoose = require( 'mongoose' );
var signupUser = mongoose.model( 'User' );

var logger = require( '../lib/akx.logger.js' );
var notifier = require( '../lib/akx.notifier.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'onboarding', err, req, res );
};

exports.view = function( req, res, next ){
    res.send( 200, {} );
    return next();
};