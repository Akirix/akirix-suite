
var mongoose = require( 'mongoose' );
var _ = require( 'lodash' );
var bcrypt = require( 'bcrypt' );
var xss = require( 'xss' );
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var notifier = require( '../lib/akx.notifier.js' );

var User = mongoose.model( 'User' );
var Registration = mongoose.model( 'Registration' );
var Inquiry = mongoose.model( 'Inquiry' );

var _this = this;

exports.handleError = function( err, req, res ){
    return util.handleError( 'user', err, req, res );
};




exports.create = function( req, res, next ){

    req.assert( 'email', 'isEmail' );
    req.assert( 'password', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        var email = xss( req.params.email.toLowerCase() );

        // Search if email is already taken
        User.findOne( { email: email }, function( err, previousUsers ){
            if( err ){
                _this.handleError( err, req, res );
                return next();
            }
            // Email is already used
            else if( !_.isEmpty( previousUsers ) ){
                res.send( 409, {
                    errors: [
                        { email: [ email + ' has already been taken. You can <a href="/login?email=' + email + '" class="alert-link">log in</a> to continue your application if you have already started one.' ] }
                    ]
                } );

                logger.info( 'user', 'Email already taken email=' + email, {
                    req: req
                } );

                return next();
            }
            // Email Available
            else{
                Inquiry.find( {}, null, null, function( err, inquiries ){
                    if( err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else if( _.isEmpty( inquiries ) ){
                        res.send( 500, { errors: [ 'Unable to create registrations' ] } );
                        return next();
                    }
                    else{
                        inquiries = _.sortBy( inquiries, 'order' );

                        var salt = bcrypt.genSaltSync( 10 );
                        var hash = bcrypt.hashSync( req.params.password, salt );

                        var newUser = new User( {
                            email: email,
                            hash: hash
                        } );

                        newUser.save( function( err ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            // Create Registration
                            else{
                                var defaults = Registration.getDefaults();
                                var regInfo = {
                                    user_id: newUser._id,
                                    user: {
                                        email: email
                                    }
                                };

                                var registration = _.extend( defaults, regInfo );

                                registration.inquiries = [];
                                _.forEach( inquiries, function( item, key ){
                                    registration.inquiries.push( {
                                        question: item.question,
                                        type: item.type,
                                        required: item.required,
                                        account_types: item.account_types,
                                        help_text: item.help_text
                                    } );
                                } );

                                var newReg = new Registration( registration );

                                newReg.save( function( err ){
                                    if( !!err ){
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else{
                                        logger.info( 'user', 'Created user[' + newUser._id + '] and registration[' + newReg._id + ']', {
                                            req: req,
                                            model: 'user',
                                            model_id: newUser._id
                                        } );

                                        notifier.sendEmail( 'reg-welcome', email, function( err, result ){
                                            if( err ){
                                                logger.error( 'user', 'Error sending reg-welcome email' );
                                            }
                                        } );

                                        var returnReg = newReg.toObject();
                                        delete returnReg.userAgreement;
                                        delete returnReg.risk;
                                        delete returnReg.changes;
                                        delete returnReg.track_changes;

                                        newUser = newUser.toObject();
                                        delete newUser.hash;

                                        res.send( 201, { user: newUser, registration: returnReg } );
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
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};




exports.getRegistration = function( req, res, next ){

    if( _.isEmpty( req.validationErrors ) ){

        Registration.findOne( { user_id: mongoose.Types.ObjectId( req.authInfo._id ) },
            function( err, registration ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !registration ){
                    res.send( 400, {
                        errors: [
                            'Cannot find registration'
                        ]
                    } );
                    return next();
                }
                else{
                    if( registration.status === 4 ){
                        Registration.update( { _id: registration._id },
                            { $set: { "status": 0 } }, {},
                            function( err ){
                                if( !!err ){
                                    _this.handleError( err, req, res );
                                }
                            } );
                    }
                    var returnData = registration.toObject();
                    delete returnData.userAgreement;
                    delete returnData.risk;
                    delete returnData.changes;
                    delete returnData.track_changes;

                    res.send( 200, { registration: returnData } );
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

    req.assert( 'password', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        var salt = bcrypt.genSaltSync( 10 );
        var hash = bcrypt.hashSync( req.params.password, salt );

        User.findByIdAndUpdate( mongoose.Types.ObjectId( req.authInfo._id ), { $set: { hash: hash } }, {}, function( err, user ){
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

                logger.info( 'user', 'user not found user_id[' + req.authInfo._id + ']', {
                    req: req

                } );
                return next();
            }
            else{
                logger.info( 'user', 'updated password for email=' + user.email, {
                    req: req,
                    model: 'user',
                    model_id: user._id
                } );

                res.send( 200, {} );
                return next();
            }
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};