




var _ = require( 'lodash' );
var bcrypt = require( 'bcryptjs' );
var moment = require( 'moment-timezone' );
var db = require( '../models' );
var User = db.User;
var Verification = db.Verification;

var logger = require( '../lib/akx.logger.js' );
var notifier = require( '../lib/akx.notifier.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;



exports.handleError = function( err, req, res ){
    util.handleError( 'user', err, req, res );
};






exports.view = function( req, res, next ){

    req.assert( 'user_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        User.find( {
            where: {
                id: req.params.user_id,
                company_id: req.user.company_id
            }
        } ).done( function( err, user ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !user ){
                res.send( 404 );
                return next();
            }
            else{
                res.send( 200, { user: user } );
                return next();
            }
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};





exports.update = function( req, res, next ){

    req.assert( 'user_id', 'isString' );
    req.assert( 'user', 'isObject' );
    req.assert( 'user.password', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        if( req.params.user_id === req.user.id ){
            User.find( {
                where: {
                    id: req.user.id
                }
            } )
                .done( function( err, user ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else if( !user ){
                        res.send( 404 );
                        return next();
                    }
                    else{
                        var salt = bcrypt.genSaltSync( 10 );

                        if( req.body.user !== null ){
                            user.hash = bcrypt.hashSync( req.params.user.password, salt );
                        }

                        user.save().done( function( err ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else{

                                res.send( 200, { user: user } );

                                notifier.notifyUser( 'akx-user-password-update', user, {}, req );
                                logger.info( 'user', user.first_name + ' ' + user.last_name + '[' + user.id + '] updated their password', {
                                    req: req,
                                    model: 'user',
                                    model_id: user.id
                                } );

                                return next();
                            }
                        } );
                    }
                } );
        }
        // Invalid access
        else{
            res.send( 404 );
            logger.info( 'security', 'user_id in request [' + req.params.user_id + '] does not match the user_id in session [' + req.user.id + ']', {
                req: req
            } );
        }
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};





exports.forgot = function( req, res, next ){

    req.assert( 'email', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        User.find( {
            where: [
                { email: req.params.email }
            ]
        } ).done( function( err, user ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !user ){
                res.send( 400, { errors: [ 'User not found' ] } );
                return next();
            }
            else{
                // Generate code
                var newVerification = Verification.build( {
                    user_id: user.id,
                    code: Math.random().toString( 36 ).substr( 2 ),
                    expires: moment.utc().add( 1440, 'minutes' ).format(),
                    verify: user.email,
                    type: 1,
                    status: 0
                } );

                newVerification.save()
                    .done( function( err, verification ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else{
                            // Send recovery email
                            notifier.notifyUser( 'akx-user-forgot', user,
                                {
                                    first_name: user.first_name,
                                    url: "https://xxx.com/password-reset?token=" + verification.code + '&email=' + user.email
                                },
                                req );

                            logger.info( 'auth', 'Password reset request sent to ' + user.email, {
                                req: req,
                                model: 'user',
                                model_id: user.id
                            } );
                            res.send( 200, {} );
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






exports.passwordReset = function( req, res, next ){

    req.assert( 'token', 'isString' );
    req.assert( 'email', 'isString' );
    req.assert( 'password', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        Verification.findAll( {
            where: [
                { code: req.params.token },
                { verify: req.params.email },
                {
                    expires: {
                        gte: moment.utc().format()
                    }
                }
            ]
        } ).done( function( err, verifications ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( verifications.length === 0 ){
                res.send( 400, { errors: [ 'Invalid token' ] } );
                return next();
            }
            else{
                // Update password
                User.find( {
                    where: [
                        { email: req.params.email }
                    ]
                } ).done( function( err, user ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else if( !user ){
                        res.send( 400, { errors: [ 'Invalid user' ] } );
                        return next();
                    }
                    else{
                        var salt = bcrypt.genSaltSync( 10 );

                        user.hash = bcrypt.hashSync( req.params.password, salt );
                        user.save().done( function( err, user ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                            }
                            else{
                                for( var i = 0; i < verifications.length; i++ ){
                                    verifications[ i ].destroy();
                                }

                                notifier.notifyUser( 'akx-user-password-reset', user, {}, req );
                                logger.info( 'email', 'User password updated via password reset ' + user.email + '[' + user.id + ']', {
                                    req: req,
                                    model: 'user',
                                    model_id: user.id
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
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};