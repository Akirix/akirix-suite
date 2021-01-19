



var bcrypt = require( 'bcryptjs' );
var _ = require( 'lodash' );
var uuidV1 = require( 'node-uuid' ).v1;
var jwt = require( 'jwt-simple' );
var moment = require( 'moment-timezone' );
var db = require( '../models' );
var User = db.User;
var Company = db.Company;
var Token = db.Token;
var Fee = db.Fee;


var config = require( '../config/config.json' );
var doIpCheck = config.doIpCheck;
var tokenConfig = config.secrets.token;
var transports = config.akxLogger.transports;
var util = require( '../lib/akx.util.js' );
var akxStrings = require( 'akx-strings' )();
var currentFileName = __filename.split( '/' ).pop();
var akxLogger = require( 'logger' )( currentFileName, transports );
var _this = this;




exports.validate = function( token, fn ){
    Token.find( {
        where: {
            token: token,
            expires: {
                gte: moment.utc().format()
            }
        }
    } ).then( function( token ){
        if( !token ){
            return fn( null, null );
        }
        else{
            var user = jwt.decode( token.data, tokenConfig );
            user.company_id = token.company_id;
            user.access = JSON.parse( token.access );
            return Fee.find( {
                where: {
                    company_id: user.company_id
                }
            } ).then( function( fee ){
                if( !fee ){
                    akxLogger.error( new Error( akxStrings.notFound( 'fee.company_id', user.company_id ) ) );
                    return fn( null, null );
                }
                else{
                    user.fee = fee;
                    return fn( null, user );
                }
            } );
        }
    } ).catch( function( err ){
        akxLogger.error( err );
        return fn( null, null );
    } );
};

exports.getIpCheckFX = function (){
    if(doIpCheck == false){
        return exports.noIpCheck;
    } else {
        return exports.ipCheck;
    }
};

exports.noIpCheck = function ( req, res, next ){
    return next();
};

exports.ipCheck = function( req, res, next ){
    if( req.user.ip !== req.headers[ 'x-real-ip' ] ){
        Token.destroy( {
            token: req.authorization.credentials
        } ).then( function(){
            //TODO: log that it failed ip check
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




exports.loginToken = function( req, res, next ){

    req.assert( 'token', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Token.find( {
            where: {
                token: req.params.token
            }
        } ).then( function( token ){
            if( !token ){
                akxLogger.security( new Error( akxStrings.notFound( 'token', token ) ), req );
                return res.send( 400, { errors: [ akxStrings.INVALID_CREDENTIALS ] } );
            }
            else{
                return User.find( {
                    where: {
                        id: token.user_id
                    },
                    include: [ Company ]
                } )
                    .then( function( user ){
                        if( !user ){
                            akxLogger.error( new Error( akxStrings.notFound( 'user', token.user_id ) ), req );
                            return res.send( 400, { errors: [ akxStrings.INVALID_CREDENTIALS ] } );
                        }
                        else{
                            var payload = {
                                id: user.id,
                                email: user.email,
                                name: user.first_name + ' ' + user.last_name,
                                expires: token.expires
                            };

                            var access = {};
                            try{
                                access = JSON.parse( user.access );
                                if( !_.isObject( access ) ){
                                    throw new Error( 'Invalid access' );
                                }
                            }
                            catch( e ){
                                akxLogger.error( e, req, null, user.access );
                                return res.send( 400, { errors: [ akxStrings.INVALID_CREDENTIALS ] } );
                            }

                            akxLogger.info( akxStrings.loggedIn( user.email, 'token' ), req );
                            res.send( 200, { access_token: token.token, user: payload, company: user.company, access: access } );
                            return next();
                        }
                    } );
            }
        } ).catch( function( err ){
            return util.handleLibError( err, req, res, akxLogger );
        } );
    }
    else{
        return util.handleValidationErrors( req, res, akxLogger );
    }
};



exports.loginCredentials = function( req, res, next ){

    req.assert( 'email', 'isEmail' );
    req.assert( 'password', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        req.params.email = req.params.email.toLowerCase();

        User.find( {
            where: {
                email: req.params.email,
                status: 1
            },
            include: [ {
                model: Company,
                where: { status: 1 }
            } ]

        } ).then( function( user ){
            if( !user ){
                akxLogger.security( new Error( akxStrings.notFound( 'user.email', req.params.email ) ), req );
                return res.send( 400, { errors: [ akxStrings.INVALID_CREDENTIALS ] } );
            }
            else{
                if( bcrypt.compareSync( req.params.password, user.hash ) ){
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
                        data: jwt.encode( payload, tokenConfig ),
                        token: jwt.encode( tokenData, tokenConfig ),
                        expires: expDate,
                        company_id: user.company_id,
                        user_id: user.id,
                        access: user.access
                    };

                    var access = {};
                    try{
                        access = JSON.parse( user.access );
                        if( !_.isObject( access ) ){
                            throw new Error( 'Invalid access' );
                        }
                    }
                    catch( e ){
                        akxLogger.error( e, req, null, user.access );
                        return res.send( 400, { errors: [ akxStrings.INVALID_CREDENTIALS ] } );
                    }

                    var newToken = Token.build( data );
                    return newToken.save()
                        .then( function(){
                            user.name = user.first_name + ' ' + user.last_name;
                            akxLogger.info( akxStrings.loggedIn( user.email, 'credentials' ), req );
                            res.send( 200, { access_token: newToken.token, user: payload, company: user.company, access: access } );
                            return next();
                        } );
                }
                else{
                    akxLogger.error( new Error( akxStrings.invalid( 'password' ) ), req );
                    return res.send( 400, { errors: [ akxStrings.INVALID_CREDENTIALS ] } );
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





exports.login = function( req, res, next ){
    if( req.params.hasOwnProperty( 'token' ) ){
        return _this.loginToken( req, res, next );
    }
    else{
        return _this.loginCredentials( req, res, next );
    }
};





exports.logout = function( req, res, next ){
    Token.find( {
        where: {
            token: req.authorization.credentials
        }
    } ).then( function( token ){
        if( !token ){
            akxLogger.security( new Error( akxStrings.notFound( 'token', req.authorization.credentials ) ), req );
            return res.send( 401 );
        }
        else{
            return token.destroy().then( function(){
                akxLogger.info( akxStrings.deleted( 'token', req.authorization.credentials ), req );
                res.send( 200 );
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
        if( req.params.refresh_token !== req.authorization.credentials ){
            akxLogger.security( new Error( akxStrings.notEqualTo( 'token', req.params.refresh_token, req.authorization.credentials ) ), req );
            return res.send( 401 );
        }
        else if( req.params.grant_type !== 'refresh_token' ){
            akxLogger.error( new Error( akxStrings.invalid( 'grant_type' ) ), req );
            return res.send( 400, { errors: [ akxStrings.invalid( 'grant_type' ) ] } );
        }
        else{
            Token.find( {
                where: {
                    token: req.params.refresh_token
                }
            } ).then( function( token ){
                if( !token ){
                    akxLogger.security( new Error( akxStrings.notFound( 'token', req.authorization.credentials ) ), req );
                    return res.send( 400, { errors: [ akxStrings.INVALID_CREDENTIALS ] } );
                }
                else{
                    return Company.find( {
                        where: {
                            id: req.user.company_id
                        }
                    } ).then( function( company ){
                        var expDate = moment.utc().add( 2880, 'minutes' ).format();

                        var payload = {
                            id: req.user.id,
                            email: req.user.email,
                            name: req.user.name,
                            expires: expDate
                        };

                        var refreshToken = Token.build( {
                            data: jwt.encode( payload, tokenConfig ),
                            user_id: req.user.id,
                            company_id: company.id,
                            access: token.access,
                            expires: expDate
                        } );

                        return refreshToken.save().then( function(){
                            return token.destroy();
                        } ).then( function(){
                            akxLogger.info( akxStrings.renewed( 'token.user_id', req.user.id ), req );
                            res.send( 200, {
                                access_token: refreshToken.id,
                                user: payload,
                                company: company,
                                access: refreshToken.access
                            } );
                            return next();
                        } );
                    } );
                }
            } ).catch( function( err ){
                return util.handleLibError( err, req, res, akxLogger );
            } );
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
        if( !token ){
            res.send( 200, { isTwoFactorAuthenticated: false } );
            return next();
        }
        else{
            res.send( 200, { isTwoFactorAuthenticated: true } );
            return next();
        }
    } ).catch( function( err ){
        return util.handleLibError( err, req, res, akxLogger );
    } );
};


exports.acl = function( req, res, next ){
    var index = req.route.method + ' ';
    if( req.route.hasOwnProperty( 'path' ) ){
        index += req.route.path;
    }
    else if( req.route.hasOwnProperty( 'url' ) ){
        index += req.route.url;
    }
    else{
        akxLogger.critical( new Error( akxStrings.missing( [ 'path', 'url' ] ) ), req );
    }
    if( _.has( req, 'user.access.' + index ) && req.user.access[ index ] ){
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
            if( !token ){
                akxLogger.security( new Error( akxStrings.invalid( 'token' ) ), req );
                return res.send( 401 );
            }
            else{
                var user = jwt.decode( token.data, tokenConfig );
                user.company_id = token.company_id;
                try{
                    user.access = JSON.parse( token.access );
                    if( !_.isObject( user.access ) ){
                        throw new Error( 'Invalid access' );
                    }
                    req.user = user;
                    return next();
                }
                catch( e ){
                    akxLogger.error( e, req, null, user.access );
                    return res.send( 400, { errors: [ akxStrings.INVALID_CREDENTIALS ] } );
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
        if( !token ){
            return res.send( 420 );
        }
        else{
            return next();
        }
    } ).catch( function( err ){
        return util.handleLibError( err, req, res, akxLogger );
    } );
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
                    akxLogger.security( new Error( akxStrings.notFound( 'token', req.params.token ) ), req );
                    return res.send( 400, { errors: akxStrings.notFound( 'token', req.params.token ) } );
                }
                else{
                    return token.destroy().then( function(){
                        akxLogger.info( akxStrings.deleted( 'token', req.params.token ), req );
                        res.send( 200, {} );
                        return next();
                    } )
                }

            } ).catch( function( err ){
                return util.handleLibError( err, req, res, akxLogger );
            } )
        }
        else{
            akxLogger.security( new Error( akxStrings.notEqualTo( 'token.token', req.params.token, req.authorization.credentials ) ), req );
            res.send( 422, {
                errors: [ {
                    status: 422,
                    title: akxStrings.INVALID_CREDENTIALS
                } ]
            } );
        }
    }
    else{
        return util.handleValidationErrors( req, res, akxLogger );
    }

};
