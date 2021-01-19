
var mongoose = require( 'mongoose' );
var _ = require( 'lodash' );
var bcrypt = require( 'bcrypt' );

var config = require( '../config/config.json' ).api;
var notifier = require( '../lib/akx.notifier.js' );
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );

var Invitation = mongoose.model( 'Invitation' );
var User = mongoose.model( 'User' );
var Registration = mongoose.model( 'Registration' );

var _this = this;

exports.handleError = function( err, req, res ){
    return util.handleError( 'registration', err, req, res );
};


exports.create = function( req, res, next ){

    // Check each validation entry and send an error response if it is missing
    var validation = {
        'email': 'string',
        'uuid': 'string',
        'company_name': 'string',
        'first_name': 'string',
        'last_name': 'string'
    };

    var valid = true;
    _.forEach( validation, function( value, index, collection ){
        if( typeof req.body[ index ] !== value ){
            valid = false;
            res.send( 400, {
                errors: [
                    { message: index + ' not found' }
                ]
            } );
            return next();
        }
    } );

    if( valid ){

        var email = req.body.email.trim().toLowerCase();

        // Check if email is already taken
        Invitation.count( { email: email }, function( err, count ){
            if( err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( count !== 0 ){
                res.send( 409, {
                    errors: [
                        { message: 'Email already taken' }
                    ]
                } );

                return next();
            }
            else{
                // Check if the email has been taken by the users
                User.count( { email: email }, function( err, count ){
                    if( err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else if( count !== 0 ){
                        res.send( 409, {
                            errors: [
                                { message: 'Email already taken' }
                            ]
                        } );
                        return next();
                    }
                    else{
                        var salt = bcrypt.genSaltSync( 10 );
                        var uuid = bcrypt.hashSync( req.body.uuid, salt );
                        var newInvitation = new Invitation( {
                            email: email,
                            uuid: uuid
                        } );

                        newInvitation.save( function( err, invitation ){
                            if( err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else{

                                var emailData = {
                                    url: config.host + '/#/invitee-welcome?email=' + email + '&uuid=' + uuid,
                                    user: {
                                        first_name: req.body.first_name,
                                        last_name: req.body.last_name
                                    },
                                    company: {
                                        name: req.body.company_name
                                    }
                                };

                                notifier.sendEmail( 'reg-invitation', email, emailData, function( err, result ){
                                    if( err ){
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else{
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


exports.complete = function( req, res, next ){

    req.assert( 'email', 'isString' );
    req.assert( 'hash', 'isString' );
    req.assert( 'uuid', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        var email = req.params.email.trim().toLowerCase();

        Invitation.findOne( {
                $and: [
                    { email: email },
                    { status: 1 }
                ]
            },
            function( err, invitation ){
                if( err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( _.isEmpty( invitation ) ){
                    res.send( 400, {
                        errors: [
                            {
                                message: 'An invitation for ' + email + ' cannot be found. Please double check your email to make sure you have been directed properly. If you have already set up a password please <a href="/#/login" class="alert-link">log in</a> with your email and password.',
                                display: true,
                                level: 0
                            }
                        ]
                    } );
                    return next();
                }
                else{
                    if( bcrypt.compareSync( req.params.uuid, invitation.uuid ) ){

                        // Create User
                        var salt = bcrypt.genSaltSync( 10 );
                        var hash = bcrypt.hashSync( req.params.hash, salt );

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
                                var defaults = Registration.getInviteeDefaults();
                                var regInfo = {
                                    parent_id: req.params.uuid,
                                    user_id: newUser._id,
                                    ip: req.connection.remoteAddress,
                                    user: {
                                        email: email
                                    }
                                };

                                var registration = _.extend( defaults, regInfo );

                                var newReg = new Registration( registration );

                                newReg.save( function( err ){
                                    if( !!err ){
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else{
                                        // Update invitation
                                        Invitation.update( { _id: invitation._id }, { $set: { status: 2 } }, function( err, numberAffected ){
                                            if( err ){
                                                _this.handleError( err, req, res );
                                                return next();
                                            }
                                            else if( numberAffected === 0 ){
                                                res.send( 500, {
                                                    errors: [
                                                        { message: 'Error updating invitation' }
                                                    ]
                                                } );
                                                return next();
                                            }
                                            else{

                                                notifier.sendEmail( 'reg-invitation-welcome', email, { user: { email: email } }, function( err, result ){
                                                    if( err ){
                                                        _this.handleError( err, req, res );
                                                        return next();
                                                    }
                                                    else{
                                                        res.send( 201, { user: newUser, registration: newReg } );
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
                        res.send( 400, {
                            errors: [
                                { message: 'Invalid uuid' }
                            ]
                        } );

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