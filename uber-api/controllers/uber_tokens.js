var config = require( '../config/config.json' );
var util = require( '../lib/akx.util.js' );
var uberDb = require( '../models_uber' );

var bcrypt = require( 'bcryptjs' );
var _ = require( 'lodash' );
var jwt = require( 'jwt-simple' );
var moment = require( 'moment-timezone' );
var Hashids = require( "hashids" );
var uuidV1 = require( 'node-uuid' ).v1;
var akxStrings = require( 'akx-strings' )();
var transports = require( '../config/config.json' ).akxLogger.transports;
var currentFileName = __filename.split( '/' ).pop();
var akxLogger = require( 'logger' )( currentFileName, transports );
var tokenSecret = config.secrets.token;
var hashidSecret = config.secrets.hashId;
var User = uberDb.UberUser;
var Token = uberDb.UberToken;

exports.validate = function( token, fn ){
    Token.find( {
        where: {
            token: token,
            expires: {
                gte: moment.utc().format()
            }
        }
    } ).then( function( token ){
        if( _.isEmpty( token ) ){
            return fn( null, null );
        }
        else{
            var user = jwt.decode( token.data, tokenSecret );
            user.access = JSON.parse( token.access );
            return fn( null, user );
        }
    } ).catch( function(){
        return fn( null, null );
    } );
};

exports.ipCheck = function( req, res, next ){
    if( req.user.ip !== req.headers[ 'x-real-ip' ] ){
        Token.destroy( {
            token: req.authorization.credentials
        } ).then( function(){
            return res.send( 401 );
        } ).catch( function( err ){
            return util.handleLibError( err, req, res, akxLogger );
        } );
    }
    else{
        return next();
    }
};

exports.login = function( req, res, next ){
    req.assert( 'email', 'isEmail' );
    req.assert( 'password', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        User.find( {
            where: {
                email: req.params.email.toLowerCase(),
                status: 1
            }
        } ).then( function( user ){
            if( _.isEmpty( user ) ){
                akxLogger.security( new Error( akxStrings.notFound( 'user.email', req.params.email ) ), req, null, {
                    where: {
                        email: req.params.email.toLowerCase(),
                        status: 1
                    }
                } );
                return res.send( 400, { errors: [ akxStrings.INVALID_CREDENTIALS ] } );
            }
            else if( bcrypt.compareSync( req.params.password, user.hash ) ){
                var expDate = moment.utc().add( 1440, 'minutes' ).format();

                var payload = {
                    id: user.id,
                    email: req.params.email,
                    name: user.first_name + ' ' + user.last_name,
                    expires: expDate,
                    ip: req.headers[ 'x-real-ip' ]
                };
                var tokenData = {
                    id: user.id,
                    uuid: uuidV1()
                };
                var data = {
                    data: jwt.encode( payload, tokenSecret ),
                    token: jwt.encode( tokenData, tokenSecret ),
                    expires: expDate,
                    uber_user_id: user.id,
                    access: user.access
                };
                return Token.create( data ).then( function( newToken ){
                    req.user = payload;
                    try{
                        var access = JSON.parse( user.access );
                    }
                    catch( e ){
                        akxLogger.security( e, req, null, user.access );
                        return res.send( 400, { errors: [ akxStrings.INVALID_CREDENTIALS ] } );
                    }

                    akxLogger.info( akxStrings.loggedIn( req.params.email, 'credentials' ), req );
                    akxLogger.info( akxStrings.created( 'uber-token', newToken.id ), req, [
                            { model: 'uber-token', model_id: newToken.id }
                        ],
                        {
                            token: newToken.token
                        } );
                    res.send( 200, {
                        access_token: newToken.token,
                        user: payload,
                        access: access,
                        token_type: 'bearer'
                    } );
                    return next();
                } );
            }
            else{
                akxLogger.security( new Error( akxStrings.invalid( 'password' ) ), req, null, {
                    email: req.params.email.toLowerCase()
                } );
                return res.send( 400, { errors: [ akxStrings.INVALID_CREDENTIALS ] } );
            }
        } ).catch( function( err ){
            return util.handleLibError( err, req, res, akxLogger );
        } );
    }
    else{
        return util.handleValidationErrors( req, res, akxLogger );
    }
};

exports.logout = function( req, res, next ){
    Token.find( {
        where: {
            token: req.authorization.credentials
        }
    } ).then( function( token ){
        if( _.isEmpty( token ) ){
            akxLogger.security( new Error( akxStrings.notFound( 'uber-token.token', req.authorization.credentials ) ), req );
            return res.send( 401 );
        }
        else{
            return token.destroy().then( function(){
                res.send( 200 );
                akxLogger.info( akxStrings.deleted( 'uber-token', token.id ), req, null, {
                    token: token.token
                } );
                return next();
            } );
        }
    } ).catch( function( err ){
        return util.handleLibError( err, req, res, akxLogger );
    } );
};

exports.refresh = function( req, res, next ){
    req.assert( 'grant_type', 'isString' );
    req.assert( 'refresh_token', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        if( req.params.refresh_token === req.authorization.credentials && req.params.grant_type === 'refresh_token' ){
            Token.find( {
                where: {
                    token: req.params.refresh_token,
                    ip: req.headers[ 'x-real-ip' ]
                }
            } ).then( function( token ){
                if( _.isEmpty( token ) ){
                    akxLogger.security( new Error( akxStrings.notFound( 'uber-token.token', req.params.refresh_token ) ), req );
                    return res.send( 400, { errors: [ akxStrings.INVALID_CREDENTIALS ] } );
                }
                else{
                    var expDate = moment.utc().add( 2880, 'minutes' ).format();
                    req.user = jwt.decode( token.data, tokenSecret );

                    var payload = {
                        id: req.user.id,
                        email: req.user.email,
                        name: req.user.name,
                        expires: expDate,
                        ip: req.headers[ 'x-real-ip' ]
                    };
                    var tokenData = {
                        id: user.id,
                        uuid: uuidV1()
                    };
                    var refreshToken = Token.build( {
                        data: jwt.encode( payload, tokenSecret ),
                        token: jwt.encode( tokenData, tokenSecret ),
                        expires: expDate,
                        uber_user_id: req.user.id,
                        access: token.access
                    } );

                    return refreshToken.save().then( function(){
                        return token.destroy();
                    } ).then( function(){
                        akxLogger.info( akxStrings.created( 'uber-token', refreshToken.id ), req, [
                                { model: 'uber-token', model_id: refreshToken.id }
                            ],
                            {
                                token: refreshToken.token
                            } );
                        res.send( 200, {
                            access_token: refreshToken.id,
                            user: payload,
                            access: refreshToken.access,
                            token: refreshToken.token,
                            token_type: 'bearer'
                        } );
                        return next();
                    } );
                }
            } ).catch( function( err ){
                return util.handleLibError( err, req, res, akxLogger );
            } );
        }
        else{
            akxLogger.security( new Error( akxStrings.notEqualTo( 'uber-token', req.params.token, req.authorization.credentials ) ), req );
            return res.send( 400, { errors: [ akxStrings.INVALID_CREDENTIALS ] } );
        }
    }
    else{
        return util.handleValidationErrors( req, res, akxLogger );
    }
};

exports.twoFactorStatus = function( req, res, next ){
    Token.find( {
        where: {
            token: req.authorization.credentials,
            two_factor_expires: {
                gte: moment.utc().format()
            }
        }
    } ).then( function( token ){
        res.send( 200, { isTwoFactorAuthenticated: !_.isEmpty( token ) } );
        return next();
    } ).catch( function( err ){
        return util.handleLibError( err, req, res, akxLogger );
    } );
};

exports.acl = function( req, res, next ){

    var index = req.route.method + ' ';
    if( req.route.hasOwnProperty( 'path' ) ){
        index += req.route.path;
    }
    else{
        akxLogger.security( new Error( akxStrings.invalid( 'req.route.path' ) ), req );
        return res.send( 401 );
    }

    if( _.has( req.user.access, index ) && req.user.access[ index ] ){
        return next();
    }
    else{
        akxLogger.security( new Error( akxStrings.METHOD_NOT_ALLOWED ), req );
        return res.send( 405 );
    }
};

exports.validateParam = function( req, res, next ){
    req.assert( 'token', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Token.find( {
            where: {
                token: req.params.token,
                expires: {
                    gte: moment.utc().format()
                }
            }
        } ).then( function( token ){
            if( _.isEmpty( token ) ){
                return res.send( 401 );
            }
            else{
                req.user = jwt.decode( token.data, tokenSecret );
                try{
                    req.user[ 'access' ] = JSON.parse( token.access );
                    return next();
                }
                catch( e ){
                    return util.handleLibError( e, req, res, akxLogger );
                }
            }
        } ).catch( function( err ){
            return util.handleLibError( err, req, res, akxLogger );
        } );
    }
    else{
        return util.handleValidationErrors( req, res, akxLogger );
    }
};

// This is a middleware
exports.twoFactorOk = function( req, res, next ){
    Token.find( {
        where: {
            token: req.authorization.credentials,
            two_factor_expires: {
                gte: moment.utc().format()
            }
        }
    } ).then( function( token ){
        if( _.isEmpty( token ) ){
            return res.send( 420, { errors: [ akxStrings.REQUIRE_2FA ] } );
        }
        else{
            // Extend the 2FA expire by 15 minutes
            token.two_factor_expires = moment.utc().add( 15, 'minutes' );
            return token.save( [ 'two_factor_expires' ] ).then( function(){
                akxLogger.info( akxStrings.updated( 'uber-token', token.id ), req,
                    [ { model: 'uber-token', model_id: token.id } ],
                    {
                        'token.two_factor_expires': token.two_factor_expires
                    } );
                return next();
            } );
        }
    } ).catch( function( err ){
        return util.handleLibError( err, req, res, akxLogger );
    } );
};


exports.toth = function( req, res, next ){
    var now = new Date();
    var timestamp = now.getFullYear().toString() + now.getMonth().toString() + now.getDate().toString() + now.getHours().toString();
    var hashids = new Hashids( hashidSecret, 10 );
    res.send( 200, { toth: hashids.encode( Number( timestamp ) ) } );
    return next();
};


exports.revoke = function( req, res, next ){
    req.assert( 'token', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        if( req.params.token === req.authorization.credentials ){
            Token.find( {
                where: {
                    token: req.params.token
                }
            } ).then( function( token ){
                if( _.isEmpty( token ) ){
                    akxLogger.security( new Error( akxStrings.notFound( 'uber-token.token', req.authorization.credentials ) ), req );
                    return res.send( 400, { errors: akxStrings.invalid( 'token' ) } );
                }
                else{
                    return token.destroy().then( function(){
                        akxLogger.info( akxStrings.deleted( 'uber-token.id', token.id ), req, null, {
                            token: token.token
                        } );
                        res.send( 200, {} );
                        return next();
                    } );
                }
            } ).catch( function( err ){
                return util.handleLibError( err, req, res, akxLogger );
            } );
        }
        else{
            akxLogger.security( new Error( akxStrings.notEqualTo( 'uber-token.token', req.params.token, req.authorization.credentials ) ), req );
            return res.send( 400, { errors: akxStrings.invalid( 'token' ) } );
        }
    }
    else{
        return util.handleValidationErrors( req, res, akxLogger );
    }
};