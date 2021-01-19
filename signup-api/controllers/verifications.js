

var mongoose = require( 'mongoose' );
var _ = require( 'lodash' );

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );

var Verification = mongoose.model( 'Verification' );
var Registration = mongoose.model( 'Registration' );

var _this = this;

exports.handleError = function( err, req, res ){
    return util.handleError( 'verification', err, req, res );
};




exports.verified = function( req, res, next ){

    req.assert( 'to', 'isString' );
    req.assert( 'token', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        // Check if there is a verified entry
        Verification.count( {
                $and: [
                    { to: req.params.to },
                    { type: 0 },
                    { token: req.params.token },
                    { status: 1 }
                ]
            },
            function( err, verifiedCount ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( verifiedCount < 1 ){
                    res.send( 200, { verified: false } );
                    return next();
                }
                else{
                    res.send( 200, { verified: true } );
                    return next();
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};



exports.verify = function( req, res, next ){

    req.assert( 'to', 'isString' );
    req.assert( 'token', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        // Check if there is a verified entry
        Verification.findOne( {
                $and: [
                    { to: req.params.to },
                    { type: 0 },
                    { token: req.params.token }
                ]
            },
            function( err, verification ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( _.isEmpty( verification ) ){
                    logger.info( 'verification', 'Verification: ' + req.params.to + ' failed validation', {
                        req: req
                    } );

                    res.send( 400, {
                        errors: [
                            'Cannot be verified'
                        ]
                    } );
                    return next();
                }
                else{
                    verification.status = 1;
                    verification.save( function( err ){
                        if( err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else{
                            logger.info( 'verification', 'Verified ' + verification.to + '[' + verification._id + ']', {
                                req: req,
                                model: 'verification',
                                model_id: verification._id
                            } );
                            res.send( 200, { verified: true } );
                            return next();
                        }
                    } );
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};
