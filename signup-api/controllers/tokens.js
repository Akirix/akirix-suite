

var mongoose = require( 'mongoose' );
var bcrypt = require( 'bcrypt' );
var jwt = require( 'jwt-simple' );
var _ = require( 'lodash' );
var moment = require( 'moment-timezone' );

var secretConfig = require( '../config/config.json' ).secrets;
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );

var User = mongoose.model( 'User' );
var Token = mongoose.model( 'Token' );
var _this = this;

exports.handleError = function( err, req, res ){
    return util.handleError( 'login', err, req, res );
};







exports.login = function( req, res, next ){
    if( req.params.hasOwnProperty( 'token' ) ){
        return _this.loginToken( req, res, next );
    }
    else{
        return _this.loginCredentials( req, res, next );
    }
};




exports.loginToken = function( req, res, next ){

    req.assert( 'token', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Token.findOne( {
                _id: mongoose.Types.ObjectId( req.params.token ),
                expires: {
                    $gte: moment.utc().format()
                }
            },
            function( err, token ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !token ){
                    res.send( 400, {
                        errors: [
                            'Incorrect token'
                        ]
                    } );

                    logger.info( 'login', 'failed login token=' + req.params.token, {
                        req: req
                    } );
                    return next();
                }
                else{
                    var payload = jwt.decode( token.data, secretConfig.token );

                    User.findOne( {
                        _id: mongoose.Types.ObjectId( payload._id )
                    }, function( err, user ){
                        if( err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else if( !user ){
                            res.send( 400, {
                                errors: [
                                    'User for token not found'
                                ]
                            } );

                            logger.info( 'login', 'could not find user with email=' + payload.email + ' user_id=' + user._id + ' for token[' + token._id + ']', {
                                req: req
                            } );
                            return next();
                        }
                        else{

                            logger.info( 'login', 'logged in user with email=' + user.email + ' user_id=' + user._id + ' for token[' + token._id + ']', {
                                req: req,
                                model: 'token',
                                model_id: token._id
                            } );

                            res.send( 201, { access_token: token._id, user: { _id: user._id, email: user.email } } );
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




exports.loginCredentials = function( req, res, next ){

    req.assert( 'email', 'isString' );
    req.assert( 'password', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        User.findOne(
            {
                $and: [
                    { email: req.params.email },
                    { status: 1 }
                ]
            },
            function( err, user ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !user ){
                    res.send( 400, {
                        errors: [
                            'Incorrect email or password. Please try again.'
                        ]
                    } );

                    logger.info( 'login', 'user not found email=' + req.params.email, {
                        req: req
                    } );
                    return next();
                }
                // Invalid password
                else if( !bcrypt.compareSync( req.params.password, user.hash ) ){
                    logger.info( 'login', 'incorrect password email=' + req.params.email, {
                        req: req
                    } );

                    res.send( 400, {
                        errors: [
                            'Incorrect email or password. Please try again.'
                        ]
                    } );
                    return next();

                }
                else{
                    var ttl = 24 * 60 * 60;
                    var expDate = moment.utc().add( ttl, 'seconds' ).format();

                    var payload = {
                        _id: user._id,
                        email: req.params.email
                    };

                    var tokenData = {
                        data: jwt.encode( payload, secretConfig.token ),
                        expires: expDate
                    };

                    var newToken = new Token( tokenData );
                    newToken.save( function( err ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else{
                            logger.info( 'login', 'logged in email=' + req.params.email, {
                                req: req,
                                model: 'token',
                                model_id: newToken._id
                            } );

                            res.send( 201, { access_token: newToken._id, user: payload } );
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






exports.logout = function( req, res, next ){
    Token.remove( {
            _id: mongoose.Types.ObjectId( req.authorization.credentials )
        },
        function( err, token ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !token ){
                res.send( 400, {
                    errors: [
                        'Unauthorized'
                    ]
                } );

                logger.info( 'login', 'token[' + req.authorization.credentials + '] not found', {
                    req: req,
                    model: 'token',
                    model_id: req.authorization.credentials
                } );

                return next();
            }
            else{
                logger.info( 'login', 'token[' + req.authorization.credentials + '] logged out', {
                    req: req,
                    model: 'token',
                    model_id: req.authorization.credentials
                } );

                res.send( 200, {} );
                return next();
            }
        } );
};






exports.renew = function( req, res, next ){
    Token.findOne( {
            _id: mongoose.Types.ObjectId( req.authorization.credentials )
        },
        function( err, token ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !token ){
                logger.info( 'login', 'token[' + req.authorization.credentials + '] not found', {
                    req: req
                } );

                res.send( 401  );
                return next();
            }
            else{
                var ttl = 24 * 60 * 60;
                token.expires = moment.utc().add( ttl, 'seconds' ).format();

                token.save( function( err ){
                    if( err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else{
                        logger.info( 'login', 'renewed token[' + token._id + '] to ' + token.expires, {
                            req: req,
                            model: 'token',
                            model_id: token._id
                        } );

                        res.send( 200, { token: token, ttl: ttl } );
                        return next();
                    }
                } )
            }
        } );
};


exports.validate = function( token, fn ){
    Token.findOne( {
            _id: mongoose.Types.ObjectId( token ),
            expires: {
                $gte: moment.utc().format()
            }
        },
        function( err, token ){
            if( !!err ){
                return fn( null, null );
            }
            else if( !token ){
                return fn( null, null );
            }
            else{
                var user = jwt.decode( token.data, secretConfig.token );
                return fn( null, user );
            }
        } );
};



exports.validateParam = function( req, res, next ){

    req.assert( 'token', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Token.findOne( {
                _id: mongoose.Types.ObjectId( req.params.token ),
                expires: {
                    $gte: moment.utc().format()
                }
            },
            function( err, token ){
                if( !!err ){
                    _this.handleError( err, req, res );
                }
                else if( !token ){
                    res.send( 401 );
                }
                else{
                    req[ 'authInfo' ] = jwt.decode( token.data, secretConfig.token );
                    return next();
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};