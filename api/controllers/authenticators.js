



var math = require( 'mathjs' );
var moment = require( 'moment-timezone' );
var _ = require( 'lodash' );
var yubikeyotp = require( 'akx-yubikeyotp' );
var config = require( '../config/config.json' );
var yubikeyConfig = config.yubikey;
var TOTP = require( 'onceler' ).TOTP;
var db = require( '../models' );
var twilioConfig = config.twilio;
var twilio = require( 'twilio' )( twilioConfig.sid, twilioConfig.token );
var qr = require( 'qr-image' );

var Authenticator = db.Authenticator;
var Token = db.Token;
var Verification = db.Verification;
var User = db.User;

var notifier = require( '../lib/akx.notifier.js' );
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;



exports.handleError = function( err, req, res ){
    util.handleError( 'authenticator', err, req, res );
};



exports.create = function( req, res, next ){

    req.assert( 'authenticator', 'isObject' );
    req.assert( 'authenticator.name', 'isString' );
    req.assert( 'authenticator.type', 'isNumber' );
    req.assert( 'authenticator.type', 'isIn', Authenticator.rawAttributes.type.validate.isIn[ 0 ] );

    if( _.isEmpty( req.validationErrors ) ){

        if( req.params.authenticator.type === 3 ){
            res.send( 400, {
                errors: [ {
                    type: [ 'Invalid type' ]
                } ]
            } );

            return next();
        }
        else{
            var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
            var key = "";
            for( var i = 0; i < 16; i++ ){
                var offset = math.randomInt( 0, alphabet.length - 1 );
                key += alphabet.charAt( offset );
            }

            var resetkey = math.randomInt( 0x1D39D3E06400000, 0x41C21CB8E0FFFFFF ).toString( 36 );

            var newAuth = Authenticator.build( {
                user_id: req.user.id,
                key: key,
                reset: resetkey,
                name: req.body.authenticator.name,
                type: req.body.authenticator.type,
                status: 0
            } );

            newAuth.save()
                .done( function( err ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else{
                        res.send( 201, { authenticator: newAuth } );
                        logger.info( 'auth', 'New authenticator' + newAuth.name + '[' + newAuth.id + '] has been created', {
                            req: req,
                            model: 'authenticator',
                            model_id: newAuth.id
                        } );

                        User.find( req.user.id )
                            .done( function( err, user ){
                                if( !!err ){
                                    _this.handleError( err, req, res );
                                }
                                else{
                                    notifier.notifyUser( 'akx-authenticator-add', user, { device_name: newAuth.name }, req );
                                }
                            } );
                        return next();
                    }
                } );
        }
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};





exports.index = function( req, res, next ){

    Authenticator.findAll( {
        where: {
            user_id: req.user.id
        }
    } )
        .done( function( err, authenticators ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                res.send( 200, { authenticators: authenticators } );
                return next();
            }
        } );
};

exports.view = function( req, res, next ){

    Authenticator.find( {
        where: {
            user_id: req.user.id,
            id: req.params.authenticator_id
        }
    } ).then( function( authenticator ){
            res.send( 200, { authenticator: authenticator } );
            return next();
    } ).catch( function( err ){
        _this.handleError( err, req, res );
        return next();
    } );
};





exports.activate = function( req, res, next ){
    req.assert( 'authenticator_id', 'isString' );
    req.assert( 'data', 'isObject' );
    req.assert( 'data.code', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Authenticator.find( {
            where: [
                { id: req.params.authenticator_id },
                { user_id: req.user.id }
            ]
        } )
            .done( function( err, authenticator ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !authenticator ){
                    res.send( 404 );
                    return next();
                }
                else if( authenticator.status === 1 ){
                    res.send( 400, { errors: [ 'Device is already active' ] } );
                    return next();
                }
                else{
                    var verified = false;

                    // TOTP
                    if( authenticator.type !== 3 ){

                        verified = Authenticator.validateTOTP( authenticator.key, req.params.data.code );

                        if( verified ){
                            authenticator.values.status = 1;

                            authenticator.save()
                                .done( function( err, result ){
                                    if( !!err ){
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else{
                                        res.send( 200, { authenticator: authenticator } );

                                        logger.info( 'auth', 'activated ' + authenticator.name + '[' + authenticator.id + ']', {
                                            req: req,
                                            model: 'authenticator',
                                            model_id: authenticator.id
                                        } );
                                        return next();
                                    }
                                } );
                        }
                        else{
                            res.send( 400, {
                                errors: [
                                    { 'data.code': [ 'Invalid code' ] }
                                ]
                            } );
                            logger.info( 'auth', 'invalid authenticator activation code[' + authenticator.id + ']', {
                                req: req
                            } );
                            return next();
                        }
                    }
                    // Yubikey (OTP)
                    else{
                        var hexUserID = yubikeyotp.modhexDecode( req.params.data.code.substring( 0, 12 ) );
                        var userID = parseInt( hexUserID, 16 ).toString();

                        // Prepend S/N with 0 if the length is less than 8
                        for( userID.length; userID.length < 8; userID = '0' + userID ){
                        }

                        if( authenticator.key.trim() !== userID ){
                            res.send( 400, {
                                errors: [
                                    { code: [ 'Invalid code' ] }
                                ]
                            } );
                            logger.error( 'security', 'Invalid userID for yubikey authenticator[' + authenticator.id + ']', {
                                req: req
                            } );
                            return next();
                        }
                        else{
                            yubikeyotp.verifyOTP( {
                                otp: req.params.data.code,
                                id: yubikeyConfig.clientId,
                                key: yubikeyConfig.apiKey,
                                apiUrl: yubikeyConfig.apiUrl
                            }, function( err, result ){
                                if( err ){
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else if( !_.isObject( result ) || !_.isString( result.status ) ){
                                    _this.handleError( new Error( 'Invalid server response' ), req, res );
                                    return next();
                                }
                                else if( result.status !== 'OK' ){
                                    res.send( 400, {
                                        errors: [
                                            { 'data.code': [ 'Invalid code' ] }
                                        ]
                                    } );
                                    logger.error( 'security', 'Invalid otp for yubikey authenticator[' + authenticator.id + '] server response=' + result.status, {
                                        req: req
                                    } );
                                    return next();
                                }
                                else{
                                    authenticator.values.status = 1;
                                    authenticator.save()
                                        .done( function( err, result ){
                                            if( !!err ){
                                                _this.handleError( err, req, res );
                                                return next();
                                            }
                                            else{
                                                res.send( 200, { authenticator: authenticator } );

                                                logger.info( 'auth', 'Authenticator ' + authenticator.name + '[' + authenticator.id + '] has been activated', {
                                                    req: req,
                                                    model: 'authenticator',
                                                    model_id: authenticator.id
                                                } );
                                                return next();
                                            }
                                        } );
                                }
                            } );
                        }
                    }
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};





exports.update = function( req, res, next ){
    res.send( 200, {} );
    return next();
};






exports.delete = function( req, res, next ){

    req.assert( 'authenticator_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Authenticator.find( {
            where: [
                { id: req.params.authenticator_id },
                { user_id: req.user.id }
            ]
        } )
            .done( function( err, authenticator ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !authenticator ){
                    res.send( 404 );
                    return next();
                }
                else if( authenticator.type === 3 ){
                    res.send( 400, { errors: [ 'key authenticators cannot be removed' ] } );
                    return next();
                }
                else{
                    authenticator.destroy()
                        .done( function( err, result ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else{
                                res.send( 200, { authenticator: authenticator } );

                                User.find( req.user.id )
                                    .done( function( err, user ){
                                        if( !!err ){
                                            logger.critical( 'error', 'Failed to find user', {
                                                req: req
                                            } );
                                        }
                                        else{
                                            notifier.notifyUser( 'akx-authenticator-revoke', user, { device_name: authenticator.name }, req );
                                        }
                                    } );

                                logger.info( 'auth', 'Authenticator [' + authenticator.id + '] has been deleted', {
                                    req: req,
                                    model: 'authenticator',
                                    model_id: authenticator.id,
                                    previousValues: authenticator.selectedValues
                                } );

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





exports.authenticate = function( req, res, next ){
    req.assert( 'data', 'isObject' );
    req.assert( 'data.code', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Token.find( {
            where: {
                token: req.authorization.credentials
            }
        } )
            .done( function( err, token ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !token ){
                    res.send( 404 );
                    return next();
                }
                else{

                    // Yubikey
                    if( req.params.data.code.length > 6 ){

                        var hexUserID = yubikeyotp.modhexDecode( req.params.data.code.substring( 0, 12 ) );
                        var userID = parseInt( hexUserID, 16 ) + '';

                        // Prepend S/N with 0 if the length is less than 8
                        for( userID.length; userID.length < 8; userID = '0' + userID ){
                        }

                        Authenticator.find( {
                            where: [
                                { user_id: req.user.id },
                                { status: 1 },
                                { type: 3 },
                                { key: userID }
                            ]
                        } )
                            .done( function( err, authenticator ){
                                if( !!err ){
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else if( _.isEmpty( authenticator ) ){
                                    res.send( 400, {
                                        errors: [
                                            { code: [ 'Invalid code' ] }
                                        ]
                                    } );

                                    return next();
                                }
                                else{
                                    yubikeyotp.verifyOTP( {
                                        otp: req.params.data.code,
                                        id: yubikeyConfig.clientId,
                                        key: yubikeyConfig.apiKey,
                                        apiUrl: yubikeyConfig.apiUrl
                                    }, function( err, result ){
                                        if( err ){
                                            _this.handleError( err, req, res );
                                            return next();
                                        }
                                        else if( !_.isObject( result ) || !_.isString( result.status ) ){
                                            _this.handleError( new Error( 'Invalid server response' ), req, res );
                                            return next();
                                        }
                                        else if( result.status !== 'OK' ){
                                            res.send( 400, {
                                                errors: [
                                                    { code: [ 'Invalid code' ] }
                                                ]
                                            } );
                                            logger.error( 'security', 'Invalid otp for yubikey authenticator[' + authenticator.id + '] server response=' + result.status, {
                                                req: req
                                            } );
                                            return next();
                                        }
                                        else{
                                            token.two_factor_expires = moment.utc().add( 15, 'minutes' );

                                            token.save( [ 'two_factor_expires' ] )
                                                .done( function( err, result ){
                                                    if( !!err ){
                                                        _this.handleError( err, req, res );
                                                        return next();
                                                    }
                                                    else{
                                                        res.send( 200, { isTwoFactorAuthenticated: true } );

                                                        logger.info( 'auth', 'two-factor authenticated', {
                                                            req: req
                                                        } );

                                                        return next();
                                                    }
                                                } );
                                        }
                                    } );
                                }
                            } );
                    }
                    //type 0-2
                    else{
                        Authenticator.findAll( {
                            where: [
                                { user_id: req.user.id },
                                { status: 1 },
                                [ 'type <> ?', 3 ]
                            ]
                        } )
                            .done( function( err, authenticators ){
                                if( !!err ){
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else{
                                    Verification.findAll( {
                                        where: [
                                            { user_id: req.user.id },
                                            { code: req.body.data.code },
                                            { status: 0 },
                                            {
                                                expires: {
                                                    gte: moment.utc().format()
                                                }
                                            }
                                        ]
                                    } )
                                        .done( function( err, verifications ){
                                            if( !!err ){
                                                _this.handleError( err, req, res );
                                                return next();
                                            }
                                            else{
                                                var verified = false;
                                                var window = 4; // allow plus-minus four iterations
                                                var counter = Math.floor( new Date().getTime() / 1000 );

                                                // Check all authenticators
                                                for( var i = 0; i < authenticators.length; i++ ){
                                                    var totp = new TOTP( authenticators[ i ].key, 6, 30 );
                                                    verified = totp.verify( req.body.data.code );

                                                    if( !verified ){
                                                        for( var j = counter - window * 30; j <= counter + window * 30; j += 30 ){
                                                            verified = ( req.body.data.code === totp.at( j ).toString() );
                                                            if( verified ) break;
                                                        }
                                                    }

                                                    if( verified ) break;
                                                }

                                                // Check all verification entries
                                                if( verifications.length >= 1 ){
                                                    verified = true;
                                                    for( var i = 0; i < verifications.length; i++ ){
                                                        verifications[ i ].destroy();
                                                    }
                                                }
                                                // verifies the token
                                                // For demo purposes, we accept anything
                                                // var verified = true;
                                                if( verified ){
                                                    token.two_factor_expires = moment.utc().add( 15, 'minutes' );

                                                    token.save( [ 'two_factor_expires' ] )
                                                        .done( function( err, result ){
                                                            if( !!err ){
                                                                _this.handleError( err, req, res );
                                                                return next();
                                                            }
                                                            else{
                                                                res.send( 200, { isTwoFactorAuthenticated: true } );

                                                                logger.info( 'auth', 'two-factor authenticated', {
                                                                    req: req
                                                                } );

                                                                return next();
                                                            }
                                                        } );
                                                }
                                                else{
                                                    res.send( 400, {
                                                        errors: [
                                                            { code: [ 'Incorrect code' ] }
                                                        ]
                                                    } );

                                                    logger.info( 'auth', 'two-factor failed code=' + req.body.data.code, {
                                                        req: req
                                                    } );

                                                    return next();
                                                }
                                            }
                                        } );
                                }
                            } );
                    }
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};





exports.sms = function( req, res, next ){
    var user = null;
    User.find( req.user.id )
        .then( function( userFound ){
            user = userFound;
            return Verification.destroy( {
                user_id: user.id,
                status: 0,
                verify: user.phone_mobile,
                type: 0
            } ).then( function(){
                var newVerification = Verification.build( {
                    user_id: user.id,
                    code: Math.random().toString( 10 ).substring( 2, 8 ),
                    expires: moment.utc().add( 15, 'minutes' ).format(),
                    verify: user.phone_mobile,
                    type: 0,
                    status: 0
                } );
                return newVerification.save();
            } ).then( function( verification ){
                    twilio.sendSms( {
                        to: user.phone_mobile,
                        from: twilioConfig.number,
                        body: 'Akirix Two-Factor Auth Code: ' + verification.code + '. Expires on ' + new Date( verification.expires ).toUTCString()
                    }, function( err, message ){
                        if( !!err ){
                            res.send( 400, { errors: [ 'There was an error sending the text message.' ] } );
                            logger.info( 'auth', 'SMS code sent to ' + user.phone_mobile + ' failed with a status code [' + err.code + ']', {
                                req: req
                            } );
                            return next();
                        }
                        else{
                            logger.info( 'auth', 'SMS code sent to ' + user.phone_mobile, {
                                req: req,
                                model: 'verification',
                                model_id: verification.id
                            } );

                            res.send( 200, { message: 'The code has been sent to mobile number XXXXXX-' + user.phone_mobile.substr( user.phone_mobile.length - 4 ) } );
                            return next();
                        }
                    } );
                }
            ).catch( function( err ){
                _this.handleError( err, req, res );
                return next();
            } )

        } );
};

exports.generateQr = function( req, res, next ){

    req.assert( 'key', 'isString' );
    req.assert( 'acctNum', 'isString' );
    req.assert( 'company_name', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        var code = qr.image( 'otpauth://totp/' + encodeURIComponent( 'XYZ' + req.params.acctNum + ' ' +  req.params.company_name ) + '?secret=' + req.params.key + '&issuer=Akirix', {
            type: 'png', ec_level: 'H', size: 5, margin: 0
        } );
        res.setHeader( 'Content-type', "image/png" );
        code.pipe( res );
        code.on( 'end', function(){
            return next();
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }

};
