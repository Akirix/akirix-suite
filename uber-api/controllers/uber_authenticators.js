var math = require( 'mathjs' );
var moment = require( 'moment-timezone' );
var request = require( 'request' );
var _ = require( 'lodash' );
var yubikeyotp = require( 'akx-yubikeyotp' );
var yubikeyCred = require( '../config/config.json' ).yubikey;
var voxlocCred = require( '../config/config.json' ).voxloc;
var TOTP = require( 'onceler' ).TOTP;
var db = require( '../models_uber' );
var twilioCredentials = require( '../config/config.json' ).twilio;
var twilio = require( 'twilio' )( twilioCredentials.sid, twilioCredentials.token );
var parseString = require( 'xml2js' ).parseString;

var Authenticator = db.UberAuthenticator;
var Token = db.UberToken;
var Verification = db.UberVerification;
var User = db.UberUser;
var qr = require( 'qr-image' );

var notifier = require( '../lib/akx.notifier.js' );
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var akxSocket = require( '../lib/akx.socket.js' ).io;
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'authenticator', err, req, res );
};

exports.create = function( req, res, next ){

    req.assert( 'uberAuthenticator', 'isObject' );
    req.assert( 'uberAuthenticator.name', 'isString' );
    req.assert( 'uberAuthenticator.type', 'isNumber' );
    req.assert( 'uberAuthenticator.type', 'isIn', Authenticator.rawAttributes.type.validate.isIn[ 0 ] );

    if( _.isEmpty( req.validationErrors ) ){

        if( req.params.uberAuthenticator.type === 3 ){
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
            if( req.body.uberAuthenticator.type !== 4 ){
                for( var i = 0; i < 16; i++ ){
                    var offset = math.randomInt( 0, alphabet.length - 1 );
                    key += alphabet.charAt( offset );
                }
            }

            var resetkey = math.randomInt( 0x1D39D3E06400000, 0x41C21CB8E0FFFFFF ).toString( 36 );

            var newAuth = Authenticator.build( {
                uber_user_id: req.user.id,
                key: key,
                reset: resetkey,
                name: req.body.uberAuthenticator.name,
                type: req.body.uberAuthenticator.type,
                status: 0
            } );

            newAuth.save()
                .done( function( err ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else{
                        res.send( 201, { uberAuthenticator: newAuth } );

                        User.find( req.user.id )
                            .done( function( err, user ){
                                if( !!err ){
                                    _this.handleError( err, req, res );
                                }
                                else{
                                    notifier.notifyUser( 'akx-authenticator-add', user, { device_name: newAuth.name }, req );
                                }
                            } );

                        logger.info( 'auth', 'New authenticator ' + newAuth.name + ' has been created', {
                            req: req,
                            model: 'uber-authenticator',
                            model_id: newAuth.id
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
        attributes: [
            'id',
            'name',
            'key',
            'status',
            'type',
            'created_at',
            'updated_at'
        ],
        where: [
            { uber_user_id: req.user.id }
        ]
    } )
        .done( function( err, authenticators ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{

                // Remove the key for activated authenticators
                for( var i = 0; i < authenticators.length; i++ ){
                    if( authenticators[ i ].status !== 0 && _.isString( authenticators[ i ].key ) ){
                        delete authenticators[ i ].values.key;
                    }
                }

                res.send( 200, { uberAuthenticators: authenticators } );
                return next();
            }
        } );
};

exports.view = function( req, res, next ){
    Authenticator.find( {
        attributes: [
            'id',
            'name',
            'key',
            'status',
            'type',
            'created_at',
            'updated_at'
        ],
        where: [
            { id: req.params.uber_authenticator_id }
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
            else{
                // Remove the key for activated authenticators
                delete authenticator.values.key;
                res.send( 200, { uberAuthenticator: authenticator } );
                return next();
            }
        } );
};

exports.activate = function( req, res, next ){
    req.assert( 'uber_authenticator_id', 'isString' );
    //req.assert( 'data', 'isObject' );
    //req.assert( 'data.code', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Authenticator.find( {
            where: [
                { id: req.params.uber_authenticator_id },
                { uber_user_id: req.user.id }
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
                    if( authenticator.type === 0 || authenticator.type === 1 || authenticator.type === 2 ){

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
                                        if( _.isString( authenticator.values.key ) ){
                                            delete authenticator.values.key;
                                        }

                                        res.send( 200, { authenticator: authenticator } );

                                        logger.info( 'auth', 'activated ' + authenticator.name + '[' + authenticator.id + ']', {
                                            req: req
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
                    else if( authenticator.type === 3 ){
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
                                id: yubikeyCred.clientId,
                                key: yubikeyCred.apiKey,
                                apiUrl: yubikeyCred.apiUrl
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
                                                if( _.isString( authenticator.values.key ) ){
                                                    delete authenticator.values.key;
                                                }

                                                res.send( 200, { uberAuthenticator: authenticator } );

                                                logger.info( 'auth', 'activated ' + authenticator.name + '[' + authenticator.id + ']', {
                                                    req: req
                                                } );
                                                return next();
                                            }
                                        } );
                                }
                            } );
                        }
                    }
                    // Voxloc
                    else if( authenticator.type === 4 ){
                        User.find( req.user.id )
                            .done( function( err, user ){
                                if( !!err ){
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else{
                                    var ip = req.headers[ 'x-real-ip' ];
                                    if( !ip ){
                                        ip = '127.0.0.1';
                                    }

                                    var url = voxlocCred.enrolment + '?callback=' + user.phone_mobile + '&email=' + user.email + '&remoteip=' + ip + '&key=' + voxlocCred.key + '&language=en&location=0';

                                    // Make Voxloc call request and store the session ID
                                    request( {
                                            method: 'GET',
                                            url: url
                                        },
                                        function( error, response, body ){
                                            parseString( body, { explicitArray: false }, function( err, responseJson ){
                                                if( !!err ){
                                                    res.send( 400, { errors: [ 'Voice service is unavaiable' ] } );
                                                    return next();
                                                }
                                                else if( !responseJson.enrol_response || responseJson.enrol_response.request_status !== '1' ){
                                                    res.send( 400, { errors: [ 'There is a problem activating this device.' ] } );
                                                    return next();
                                                }
                                                else{
                                                    authenticator.set( 'key', responseJson.enrol_response.user_id );
                                                    authenticator.save()
                                                        .done( function( err, authenticator ){
                                                            if( !!err ){
                                                                _this.handleError( err, req, res );
                                                                return next();
                                                            }
                                                            else{
                                                                // Generate code
                                                                var newVerification = Verification.build( {
                                                                    uber_user_id: req.user.id,
                                                                    uber_token_id: req.authorization.credentials,
                                                                    code: responseJson.enrol_response.session_id,
                                                                    expires: moment.utc().add( 15, 'minutes' ).format(),
                                                                    verify: authenticator.id,
                                                                    type: 2,
                                                                    status: 0
                                                                } );

                                                                newVerification.save()
                                                                    .done( function( err, verification ){
                                                                        if( !!err ){
                                                                            _this.handleError( err, req, res );
                                                                            return next();
                                                                        }
                                                                        else{
                                                                            res.send( 200, { uberAuthenticator: authenticator } );
                                                                            return next();
                                                                        }
                                                                    } );
                                                            }
                                                        } );
                                                }
                                            } );
                                        } );
                                }
                            } );
                    }
                    else{
                        res.send( 400, { errors: [ 'There is a problem activating this device.' ] } );
                        return next();
                    }

                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};


exports.delete = function( req, res, next ){

    req.assert( 'uber_authenticator_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Authenticator.find( {
            where: [
                { id: req.params.uber_authenticator_id },
                { uber_user_id: req.user.id }
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
                                // remove key from response
                                if( _.isString( authenticator.values.key ) ){
                                    delete authenticator.values.key;
                                }

                                res.send( 200, { uberAuthenticator: authenticator } );

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

                                logger.info( 'auth', 'Authenticator [' + authenticator.name + '] has been deleted', {
                                    req: req,
                                    model: 'uber-authenticator',
                                    model_id: authenticator.id,
                                    previousValues: authenticator
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
                    // Voice
                    if( req.params.data.code === 'voice' ){
                        Authenticator.find( {
                            where: [
                                { uber_user_id: req.user.id },
                                { status: 1 },
                                { type: 4 },
                                { id: req.params.data.authenticator_id }
                            ]
                        } )
                            .done( function( err, authenticator ){
                                if( !!err ){
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else if( !authenticator ){
                                    res.send( 400, {
                                        errors: [
                                            { code: [ 'Invalid authenticator' ] }
                                        ]
                                    } );
                                    return next();
                                }
                                else{
                                    User.find( req.user.id )
                                        .done( function( err, user ){
                                            if( !!err ){
                                                _this.handleError( err, req, res );
                                                return next();
                                            }
                                            else{
                                                var ip = req.headers[ 'x-real-ip' ];
                                                if( !ip ){
                                                    ip = '127.0.0.1';
                                                }

                                                var url = voxlocCred.verification + '?user_id=' + authenticator.key + '&callback=' + user.phone_mobile + '&email=' + user.email + '&remoteip=' + ip + '&key=' + voxlocCred.key + '&language=en&location=0';

                                                // Make Voxloc call request and store the session ID
                                                request( {
                                                        method: 'GET',
                                                        url: url
                                                    },
                                                    function( error, response, body ){
                                                        parseString( body, { explicitArray: false }, function( err, responseJson ){
                                                            if( !!err ){
                                                                res.send( 400, { errors: [ 'Voice service is unavaiable' ] } );
                                                                return next();
                                                            }
                                                            else if( !responseJson.verify_response || responseJson.verify_response.request_status !== '1' ){
                                                                res.send( 400, { errors: [ 'There is a problem authenticate with this device.' ] } );
                                                                return next();
                                                            }
                                                            else{
                                                                // Generate code
                                                                var newVerification = Verification.build( {
                                                                    uber_user_id: req.user.id,
                                                                    uber_token_id: req.authorization.credentials,
                                                                    code: responseJson.verify_response.session_id,
                                                                    expires: moment.utc().add( 15, 'minutes' ).format(),
                                                                    verify: authenticator.id,
                                                                    type: 3,
                                                                    status: 0
                                                                } );

                                                                newVerification.save()
                                                                    .done( function( err, verification ){
                                                                        if( !!err ){
                                                                            _this.handleError( err, req, res );
                                                                            return next();
                                                                        }
                                                                        else{
                                                                            res.send( 200, { uberAuthenticator: authenticator } );
                                                                            return next();
                                                                        }
                                                                    } );
                                                            }
                                                        } );
                                                    } );
                                            }
                                        } );
                                }
                            } );
                    }
                    // Yubikey
                    else if( req.params.data.code.length > 6 ){

                        var hexUserID = yubikeyotp.modhexDecode( req.params.data.code.substring( 0, 12 ) );
                        var userID = parseInt( hexUserID, 16 ) + '';

                        // Prepend S/N with 0 if the length is less than 8
                        for( userID.length; userID.length < 8; userID = '0' + userID ){
                        }

                        Authenticator.find( {
                            where: [
                                { uber_user_id: req.user.id },
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
                                        id: yubikeyCred.clientId,
                                        key: yubikeyCred.apiKey,
                                        apiUrl: yubikeyCred.apiUrl
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
                    else{
                        Authenticator.findAll( {
                            where: [
                                { uber_user_id: req.user.id },
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
                                            { uber_user_id: req.user.id },
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
                                                        for( var i = counter - window * 30; i <= counter + window * 30; i += 30 ){
                                                            verified = req.body.data.code == totp.at( i );
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
            if( !userFound ){
                res.send( 400, { errors: [ 'Invalid user' ] } );
                return next();
            }
            else{
                // Destroy previous code
                return Verification.destroy( {
                    uber_user_id: user.id,
                    status: 0,
                    verify: user.phone_mobile,
                    type: 0
                } ).then( function(){
                    // Generate code
                    var newVerification = Verification.build( {
                        uber_user_id: user.id,
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
                        from: twilioCredentials.number,
                        body: 'Akirix Uber 2FA Code: ' + verification.code + '. Expires on ' + new Date( verification.expires ).toUTCString()
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
                                req: req
                            } );

                            res.send( 200, { message: 'The code has been sent to mobile number XXXXXX-' + user.phone_mobile.substr( user.phone_mobile.length - 4 ) } );
                            return next();
                        }
                    } );
                } ).catch( function( err ){
                    _this.handleError( err, req, res );
                    return next();
                } );
            }
        } )
        .catch( function( err ){
            _this.handleError( err, req, res );
            return next();
        } );

};

exports.generateQr = function( req, res, next ){

    req.assert( 'key', 'isString' );
    req.assert( 'name', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        var code = qr.image( 'otpauth://totp/' + encodeURIComponent( 'Akirix Uber: ' + req.params.name ) + '?secret=' + req.params.key + '&issuer=Akirix', {
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


exports.voxloc = function( req, res, next ){
    if( !_.isEmpty( req.params.result ) && !_.isEmpty( req.params.session_id ) && req.params.result === '0' ){
        Verification.find( {
            where: [
                { code: req.params.session_id },
                { type: [ 2, 3 ] },
                { status: 0 },
                {
                    expires: {
                        gte: moment.utc().format()
                    }
                }
            ]
        } )
            .done( function( err, verification ){
                if( !!err ){
                    res.send( 200, {} );
                    return next();
                }
                else if( !verification ){
                    res.send( 200, {} );
                    return next();
                }
                else{
                    if( verification.type === 2 ){
                        // Device status
                        Authenticator.find( {
                            where: [
                                { id: verification.verify },
                                { status: 0 }
                            ]
                        } )
                            .done( function( err, auth ){
                                if( !!err ){
                                    res.send( 200, {} );
                                    return next();
                                }
                                else if( !auth ){
                                    res.send( 200, {} );
                                    return next();
                                }
                                else{
                                    auth.status = 1;
                                    auth.save().done( function( err, auth ){
                                        // Find the token of the user and channel and broadcast the message via socket

                                        Token.find( {
                                            where: [
                                                { token: verification.uber_token_id },
                                                {
                                                    expires: {
                                                        gte: moment.utc().format()
                                                    }
                                                }
                                            ]
                                        } ).success( function( token ){
                                            akxSocket.to( token.id ).emit( 'command', {
                                                action: 'refresh',
                                                model: 'uber-authenticator',
                                                model_id: auth.id
                                            } );
                                        } );

                                        res.send( 200, { status: 1 } );
                                        return next();
                                    } );
                                }
                            } );
                    }
                    else if( verification.type === 3 ){
                        Token.find( {
                            where: [
                                { token: verification.uber_token_id },
                                {
                                    expires: {
                                        gte: moment.utc().format()
                                    }
                                }
                            ]
                        } ).success( function( token ){
                            token.two_factor_expires = moment.utc().add( 15, 'minutes' );

                            token.save( [ 'two_factor_expires' ] )
                                .done( function( err, result ){
                                    akxSocket.to( token.id ).emit( 'event', {
                                        name: 'two_factor_authenticated'
                                    } );
                                    res.send( 200, { status: 1 } );
                                    return next();
                                } );
                        } );
                    }
                    verification.destroy();
                }
            } );
    }
    else{
        res.send( 400, {} );
        return next();
    }
};
