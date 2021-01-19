var _ = require( 'lodash' );
var bcrypt = require( 'bcryptjs' );
var moment = require( 'moment-timezone' );
var db = require( '../models_uber' );
var Hashids = require( "hashids" );
var config = require( '../config/config.json' );
var hashidSecret = config.secrets.hashId;
var passwordRequirements = config.password_requirements;
var User = db.UberUser;
var Verification = db.UberVerification;
var UberPassword = db.UberPassword;

var logger = require( '../lib/akx.logger.js' );
var notifier = require( '../lib/akx.notifier.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'user', err, req, res );
};

exports.index = function( req, res, next ){

};


exports.create = function( req, res, next ){
    var salt = bcrypt.genSaltSync( 10 );
    var hash = bcrypt.hashSync( req.body.password, salt );
    var newUser = User.build( {
        email: req.body.email,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        hash: hash,
        access: JSON.stringify( {} )
    } );

    newUser.save()
        .done( function( err ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                res.send( 201, { user: newUser } );
                logger.info( 'user', 'user ' + newUser.first_name + ' ' + newUser.last_name + ' has been created', {
                    req: req,
                    model: 'uber-user',
                    model_id: newUser.id
                } );
                return next();
            }
        } );
};

exports.index = function( req, res, next ){

    User.findAll( {
        where: {
            status: 1
        }
    } )
        .then( function( users ){

            var filterValues = [
                'hash',
                'status'
            ];

            _.forEach( filterValues, function( value ){
                _.forEach( users, function( user ){
                    if( _.has( user.values, value ) ){
                        delete user.values[ value ];
                    }
                } );
            } );

            res.send( 200, { uberUsers: users } );
            return next();
        } )
        .catch( function( err ){
            _this.handleError( err, req, res );
            return next();
        } );
};

exports.view = function( req, res, next ){

    req.assert( 'uber_user_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        User.find( {
            where: {
                id: req.params.uber_user_id
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
                    if( user.values.hasOwnProperty( 'hash' ) ){
                        delete user.values.hash;
                    }

                    res.send( 200, { uberUser: user } );
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

    req.assert( 'uber_user_id', 'isString' );
    req.assert( 'uberUser', 'isObject' );
    req.assert( 'uberUser.password', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        if( req.params.uber_user_id === req.user.id ){
            User.find( {
                where: {
                    id: req.user.id
                }
            } ).done( function( err, user ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !user ){
                    res.send( 404 );
                    logger.error( 'uber-user', 'No user found with id [' + req.params.uber_user_id + ']', {
                        req: req
                    } );
                    return next();
                }
                else if( req.body.uberUser !== null ){
                    passwordValidations( req.body.uberUser.password, user.id ).then( function(){
                        var salt = bcrypt.genSaltSync( 10 );
                        var hash = bcrypt.hashSync( req.body.uberUser.password, salt );

                        UberPassword.create( {
                            uber_user_id: user.id,
                            hash: hash
                        } );
                        user.hash = hash;
                        user.save().done( function( err ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else{

                                if( user.values.hasOwnProperty( 'hash' ) ){
                                    delete user.values.hash;
                                }
                                res.send( 200, { uberUser: user } );

                                notifier.notifyUser( 'akx-user-password-update', user, {}, req );
                                logger.info( 'user', 'User ' + user.first_name + ' ' + user.last_name + ' has been updated', {
                                    req: req,
                                    model: 'uber-user',
                                    model_id: user.id
                                } );

                                return next();
                            }
                        } );
                    } ).catch( function( errors ){
                        res.send( 400, { errors: errors } );
                        logger.error( 'uber-user', 'password validation errors', {
                            req: req
                        } );
                        return next();
                    } );
                }
                else{
                    return next();
                }
            } );
        }
        // Invalid access
        else{
            res.send( 404 );
            logger.info( 'security', 'uber_user_id in request [' + req.params.uber_user_id + '] does not match the uber_user_id in session [' + req.user.id + ']', {
                req: req
            } );
        }
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.updatePassword = function( req, res, next ){

    req.assert( 'uberUser', 'isObject' );
    req.assert( 'uberUser.password', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        User.find( {
            where: {
                id: req.user.id
            }
        } ).done( function( err, user ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !user ){
                res.send( 404 );
                logger.error( 'uber-user', 'No user found with id [' + req.user.id + ']', {
                    req: req
                } );
                return next();
            }
            else if( req.body.uberUser !== null ){
                passwordValidations( req.body.uberUser.password, user.id ).then( function(){
                    var salt = bcrypt.genSaltSync( 10 );
                    var hash = bcrypt.hashSync( req.body.uberUser.password, salt );

                    UberPassword.create( {
                        uber_user_id: user.id,
                        hash: hash
                    } );
                    user.hash = hash;
                    user.save().done( function( err ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else{

                            if( user.values.hasOwnProperty( 'hash' ) ){
                                delete user.values.hash;
                            }
                            res.send( 200, { uberUser: user } );

                            notifier.notifyUser( 'akx-user-password-update', user, {}, req );
                            logger.info( 'user', 'User password ' + user.first_name + ' ' + user.last_name + ' has been updated', {
                                req: req,
                                model: 'uber-user',
                                model_id: user.id
                            } );

                            return next();
                        }
                    } );
                } ).catch( function( errors ){
                    res.send( 400, { errors: errors } );
                    logger.error( 'uber-user', 'password validation errors', {
                        req: req
                    } );
                    return next();
                } );
            }
            else{
                return next();
            }
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.forgot = function( req, res, next ){

    req.assert( 'email', 'isString' );
    req.assert( 'toth', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        var now = new Date();
        var timestamp = now.getFullYear().toString() + now.getMonth().toString() + now.getDate().toString() + now.getHours().toString();
        var hashids = new Hashids( hashidSecret, 10 );
        var hash = hashids.encode( Number( timestamp ) );

        if( hash === req.params.toth ){

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
                        uber_user_id: user.id,
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
                                logger.info( 'auth', 'Password reset request sent to ' + user.email, {
                                    req: req
                                } );
                                res.send( 200, {} );
                                return next();
                            }
                        } );
                }
            } );
        }
        else{
            res.send( 400, { errors: [ 'Incorrect T.O.T.H.' ] } );
            return next();
        }
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
                logger.error( 'security', 'Invalid token for password reset', {
                    req: req
                } );
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
                        passwordValidations( req.params.password, user.id ).then( function(){
                            var salt = bcrypt.genSaltSync( 10 );
                            var hash = bcrypt.hashSync( req.params.password, salt );

                            UberPassword.create( {
                                uber_user_id: user.id,
                                hash: hash
                            } );
                            user.hash = hash;
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
                                        req: req
                                    } );

                                    res.send( 200, {} );
                                    return next();
                                }
                            } );
                        } ).catch( function( errors ){
                            res.send( 400, { errors: errors } );
                            logger.error( 'uber-user', 'password validation errors', {
                                req: req
                            } );
                            return next();
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

function passwordValidations( password, userId ){
    return new Promise( function( resolve, reject ){
        var errors = [];
        //check length
        if( password.length < passwordRequirements.password_length ){
            errors.push( 'Password needs to be at least ' + passwordRequirements.password_length + ' characters long' );
        }
        //Check for numbers
        if( !password.match( /[0-9]/ ) || password.match( /[0-9]/g ).length < passwordRequirements.numbers ){
            errors.push( 'Password requires at least ' + passwordRequirements.numbers + ' numbers' );
        }
        //Check for minimum lowercase
        if( !password.match( /[a-z]/ ) || password.match( /[a-z]/g ).length < passwordRequirements.lowercase ){
            errors.push( 'Password requires at least ' + passwordRequirements.lowercase + ' lowercase' );
        }
        //Check for minimum uppercase
        if( !password.match( /[A-Z]/ ) || password.match( /[A-Z]/g ).length < passwordRequirements.uppercase ){
            errors.push( 'Password requires at least ' + passwordRequirements.uppercase + ' uppercase' );
        }
        //Check for special characters
        if( !password.match( /[^A-Za-z0-9]/ ) || password.match( /[^A-Za-z0-9]/g ).length < passwordRequirements.symbols ){
            errors.push( 'Password requires at least ' + passwordRequirements.symbols + ' special characters' );
        }
        if( _.isEmpty( errors ) ){
            UberPassword.findAll( {
                where: {
                    uber_user_id: userId
                },
                order: [
                    [ 'created_at', 'DESC' ]
                ],
                limit: passwordRequirements.previous_passwords
            } ).then( function( previousPasswords ){
                var match = false;
                if( !_.isEmpty( previousPasswords ) ){
                    previousPasswords.forEach( function( prevPass ){
                        match = match | bcrypt.compareSync( password, prevPass.hash )
                    } );
                }
                if( match ){
                    errors.push( 'Password cannot be one previously used' );
                    reject( errors );
                }
                resolve();
            } ).catch( function( err ){
                reject( [ err ] );
            } );
        }
        else{
            reject( errors );
        }
    } );
}

exports.checkPasswordExpiration = function( req, res, next ){
    UberPassword.findAll( {
        where: {
            uber_user_id: req.user.id
        },
        order: [
            [ 'created_at', 'DESC' ]
        ],
        limit: 1
    } ).then( function( previousPasswords ){
        if( _.isEmpty( previousPasswords ) ){
            return User.find( {
                where: {
                    id: req.user.id
                }
            } ).then( function( user ){
                return UberPassword.create( {
                    uber_user_id: user.id,
                    hash: user.hash
                } ).then( function(){
                    return next();
                } );
            } );
        }
        var prevPassDate = moment( previousPasswords[ 0 ].created_at );
        prevPassDate.add( passwordRequirements.expiresNumber, passwordRequirements.expiresUnit );
        if( moment.utc().unix() > prevPassDate.unix() ){
            res.send( 498, {
                errors: [ 'Please reset your password' ]
            } );
        }
        else{
            return next();
        }
    } ).catch( function( err ){
        _this.handleError( err, req, res );
        return next();
    } );
};
