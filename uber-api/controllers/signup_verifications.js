var _ = require( 'lodash' );
var moment = require( 'moment-timezone' );
var mongoose = require( 'mongoose' );
var signupVerification = mongoose.model( 'Verification' );
var signupSignupUser = mongoose.model( 'User' );
var signupRegistration = mongoose.model( 'Registration' );

var twilioCredentials = require( '../config/config.json' ).twilio;
var twilio = require( 'twilio' )( twilioCredentials.sid, twilioCredentials.token );

var logger = require( '../lib/akx.logger.js' );
var notifier = require( '../lib/akx.notifier.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'onboarding', err, req, res );
};

exports.create = function( req, res, next ){
    req.assert( 'user_id', 'isString' );
    req.assert( 'type', 'isIn', [ 0, 1 ] );

    if( _.isEmpty( req.validationErrors ) ){
        signupRegistration.findOne( {
            user_id: mongoose.Types.ObjectId( req.params.user_id )
        }, function( err, registration ){
            if( err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( _.isEmpty( registration ) ){
                res.send( 400, {
                    errors: [
                        { user_id: [ 'Invalid user_id' ] }
                    ]
                } );
                return next();
            }
            else if( req.params.type === 1 && _.isEmpty( registration.user.phone_mobile ) ){
                res.send( 400, {
                    errors: [
                        'Cannot find phone number'
                    ]
                } );
                return next();
            }
            else{
                var newVerification = new signupVerification( {
                    user_id: req.params.user_id,
                    type: req.params.type
                } );

                if( newVerification.type === 0 ){
                    newVerification.to = registration.user.email;
                }
                else if( newVerification.type === 1 ){
                    newVerification.to = registration.user.phone_mobile;
                }

                newVerification.save( function( err ){
                    if( err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else{
                        if( newVerification.type === 0 ){
                            res.send( 200, {} );
                            return next();
                        }
                        else if( newVerification.type === 1 ){
                            twilio.sendSms( {
                                to: registration.user.phone_mobile,
                                from: twilioCredentials.number,
                                body: 'Your phone is now ready to receive two-factor authentication codes'
                            }, function( err, message ){
                                if( !!err ){
                                    res.send( 400, { errors: [ 'There was an error sending the text message.' ] } );
                                    logger.info( 'auth', 'SMS code sent to ' + registration.user.phone_mobile + ' failed with a status code [' + err.code + ']', {
                                        req: req
                                    } );
                                    return next();
                                }
                                else{
                                    logger.info( 'auth', 'SMS code sent to ' + registration.user.phone_mobile, {
                                        req: req
                                    } );

                                    res.send( 200, { message: 'The code has been sent to mobile number XXXXXX-' + registration.user.phone_mobile.substr( registration.user.phone_mobile.length - 4 ) } );
                                    return next();
                                }
                            } );
                        }
                    }
                } );
            }
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
    return next();
};

exports.index = function( req, res, next ){
    req.assert( 'user_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        signupVerification.find( {
            $and: [
                { user_id: mongoose.Types.ObjectId( req.params.user_id ) }
            ]
        }, function( err, verifications ){
            res.send( 200, { verifications: verifications } );
            return next();
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
    return next();
};
