
var mongoose = require( 'mongoose' );
var _ = require( 'lodash' );
var bcrypt = require( 'bcrypt' );
var uuid = require( 'node-uuid' );

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var notifier = require( '../lib/akx.notifier.js' );
var appConfig = require( '../config/config.json' ).app;

var PasswordRecovery = mongoose.model( 'PasswordRecovery' );
var User = mongoose.model( 'User' );

var _this = this;

exports.handleError = function( err, req, res ){
    return util.handleError( 'password-recovery', err, req, res );
};




exports.create = function( req, res, next ){

    req.assert( 'email', 'isEmail' );

    if( !_.isEmpty( req.validationErrors ) ){
        util.handleValidationErrors( req, res );
        return next();
    }
    else{
        var email = req.params.email.trim().toLowerCase();

        // See if the email is valid
        User.findOne( { email: email }, function( err, user ){
            if( err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( _.isEmpty( user ) ){
                res.send( 400, {
                    errors: [
                        'User not found'
                    ]
                } );
                logger.info( 'password-recovery', 'Email not found email=' + email, {
                    req: req
                } );
                return next();
            }
            else{
                var expDate = new Date( Date.now() - PasswordRecovery.expirationTime ); // 15 min in the past

                PasswordRecovery.count( {
                    $and: [
                        { user_id: user._id },
                        { created: { $gt: expDate } },
                        { status: 0 }
                    ]
                }, function( err, recoveryCount ){
                    if( err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else if( recoveryCount > 0 ){
                        res.send( 400, {
                            errors: [ 'Another password recovery request has already been made. Please check your email for the request.' ]
                        } );

                        logger.info( 'password-recovery', 'Recovery attempted but not made not found email=' + email, {
                            req: req
                        } );
                        return next();
                    }
                    else{

                        var passwordRecovery = new PasswordRecovery( {
                            user_id: user._id,
                            token: uuid.v4()
                        } );

                        passwordRecovery.save( function( err ){
                            if( err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else{
                                notifier.sendEmail( 'akx-user-forgot', email, {
                                    first_name: '',
                                    url: appConfig.host + '/password-reset?token=' + passwordRecovery.token + '&email=' + user.email
                                }, function( err, result ){
                                    if( !_.isEmpty( err ) ){
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else{
                                        logger.info( 'password-recovery', 'created email=' + email + ' [' + passwordRecovery._id + ']', {
                                            req: req,
                                            model: 'password-recovery',
                                            model_id: passwordRecovery._id
                                        } );

                                        res.send( 201, {} );
                                        return next();
                                    }
                                } );
                            }
                        } );
                    }
                } );
            }
        } );
    }
};




exports.validate = function( req, res, next ){

    req.assert( 'token', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        var expDate = new Date( Date.now() - PasswordRecovery.expirationTime ); // 15 min in the past
        PasswordRecovery.count( {
            $and: [
                { status: 0 },
                { token: req.params.token },
                { created: { $gt: expDate } }
            ]
        }, function( err, recoveryCount ){
            if( err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( recoveryCount > 0 ){
                res.send( 200, {} );
                return next();
            }
            else{
                res.send( 404, {} );
                return next();
            }
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};




exports.updatePassword = function( req, res, next ){

    req.assert( 'token', 'isString' );
    req.assert( 'password', 'isString' );
    req.assert( 'email', 'isEmail' );


    if( !_.isEmpty( req.validationErrors ) ){
        util.handleValidationErrors( req, res );
        return next();
    }
    else{
        var expDate = new Date( Date.now() - PasswordRecovery.expirationTime ); // 15 min in the past

        PasswordRecovery.findOne( {
            $and: [
                { status: 0 },
                { token: req.params.token },
                { created: { $gt: expDate } }
            ]
        }, function( err, passwordRecovery ){
            if( err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( _.isEmpty( passwordRecovery ) ){
                res.send( 400, {
                    errors: [ 'Invalid token' ]
                } );

                logger.info( 'password-recovery', 'invalid token ' + req.params.token, {
                    req: req
                } );

                return next();
            }
            else{
                var salt = bcrypt.genSaltSync( 10 );
                var hash = bcrypt.hashSync( req.params.password, salt );

                User.findOne( {
                    $and: [
                        { _id: passwordRecovery.user_id },
                        { email: req.params.email }
                    ]
                }, function( err, user ){
                    if( err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else if( _.isEmpty( user ) ){
                        res.send( 400, {
                            errors: [ 'User not found' ]
                        } );

                        logger.info( 'password-recovery', 'passwordRecovery user not found user_id=' + passwordRecovery.user_id + ' [' + passwordRecovery._id + ']', {
                            req: req
                        } );
                        return next();
                    }
                    else{

                        // Update the user's password
                        user.hash = hash;
                        user.save( function( err ){
                            if( err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else{
                                logger.info( 'user', 'updated password [' + user.id + ']', {
                                    req: req,
                                    model: 'user',
                                    model_id: user.id
                                } );

                                // Update the passwordRecovery
                                passwordRecovery.status = 1;
                                passwordRecovery.save( function( err, passwordRecovery, numberAffected ){
                                    if( err ){
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else if( numberAffected <= 0 ){

                                        logger.info( 'password-recovery', 'failed to change status to 1 (complete) [' + passwordRecovery.id + ']', {
                                            req: req,
                                            model: 'password-recovery',
                                            model_id: passwordRecovery.id
                                        } );

                                        res.send( 500, {
                                            errors: [
                                                'An internal error has occurred'
                                            ]
                                        } );
                                        return next();
                                    }
                                    else{
                                        logger.info( 'password-recovery', 'Changed status to 1 (complete) [' + passwordRecovery.id + ']', {
                                            req: req,
                                            model: 'password-recovery',
                                            model_id: passwordRecovery.id
                                        } );

                                        res.send( 200, {} );
                                        return next();
                                    }
                                } );
                            }
                        } );
                    }
                } );
            }
        } );
    }
};