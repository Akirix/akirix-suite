var math = require( 'mathjs' );
var db = require( '../models' );
var uberDb = require( '../models_uber' );
var _ = require( 'lodash' );
var bcrypt = require( 'bcryptjs' );
var moment = require( 'moment-timezone' );
var jwt = require( 'jwt-simple' );
var tokenConfig = require( '../config/config.json' ).secrets.token;
var config = require( '../config/config.json' );
var twilioConfig = config.twilio;
var twilio = require( 'twilio' )( twilioConfig.sid, twilioConfig.token );

var User = db.User;
var Verification = db.Verification;

var notifier = require( '../lib/akx.notifier.js' );
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'verification', err, req, res );
};





exports.index = function( req, res, next ){
    Verification.findAll( {
        where: {
            user_id: req.params.user_id,
            expires: {
                gte: moment().format( 'YYYY-MM-DD HH:mm:ss' )
            }
        },
        order: "expires DESC"
    } ).then( function( verifications ){
        res.send( 200, { verifications: verifications } );
        return next();
    } ).catch( function( err ){
        _this.handleError( err, req, res );
        return next();
    } )
};



exports.add = function( req, res, next ){
    req.assert( 'verification', 'isObject' );
    req.assert( 'verification.user_id', 'isString' );
    req.assert( 'verification.type', 'isNumber' );

    if( _.isEmpty( req.validationErrors ) ){
        User.find( {
            where: {
                id: req.params.verification.user_id
            }
        } ).then( function( user ){
            if( !user ){
                res.send( 404, { errors: [ 'User not found' ] } );
                return next();
            }
            else{
                var newVerification = Verification.build( {
                    user_id: user.id,
                    expires: moment.utc().add( 15, 'minutes' ).format(),
                    status: 0
                } );
                switch( req.params.verification.type ){
                    case 0:
                        newVerification.type = 0;
                        newVerification.code = Math.random().toString( 10 ).substring( 2, 8 );
                        newVerification.verify = user.phone_mobile;

                        newVerification.save().then( function( verification ){
                            twilio.sendSms( {
                                to: user.phone_mobile,
                                from: twilioConfig.number,
                                body: 'Akirix Two-Factor Auth Code: ' + verification.code + '. Expires on ' + new Date( verification.expires ).toUTCString()
                            }, function( err, message ){
                                if( !!err ){
                                    res.send( 400, { errors: [ 'There was an error sending the text message' ] } );
                                    logger.info( 'auth', 'SMS code sent to ' + user.phone_mobile + ' failed with a status code [' + err.code + ']', {
                                        req: req
                                    } );
                                    return next();
                                }
                                else{
                                    logger.info( 'auth', 'SMS code sent to ' + user.phone_mobile, {
                                        req: req,
                                        model: 'verification',
                                        model_id: newVerification.id
                                    } );
                                    res.send( 200, { verification: newVerification } );
                                    return next();
                                }
                            } );
                        } );
                        break;
                    case 1:
                        newVerification.code = Math.random().toString( 36 ).substring( 2 );
                        newVerification.type = 1;
                        newVerification.verify = user.email;

                        newVerification.save().then( function( verification ){
                            logger.info( 'auth', 'Password reset request sent to ' + user.email + '[' + user.id + ']', {
                                req: req
                            } );
                            res.send( 200, { verification: newVerification } );
                            return next();
                        } ).catch( function( err ){
                            logger.error( 'auth', 'New verification failed to save with email - ' + user.email + '', {
                                req: req,
                                model: 'verification'
                            } );
                            _this.handleError( err, req, res );
                            return next();
                        } );
                        break;
                    default:
                        logger.error( 'auth', 'New verification failed to save with email - ' + user.email + '', {
                            req: req,
                            model: 'verification'
                        } );
                        res.send( 400, { errors: [ 'Invalid verification type' ] } );
                        return next();
                }
            }
        } ).catch( function( err ){
            _this.handleError( err, req, res );
            return next();
        } )
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};
