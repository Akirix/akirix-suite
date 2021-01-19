/**
 * Utility Component for the testing suite
 *
 * @module testing
 * @class db-utilities
 *
 * @uses mongoose
 * @uses lodash
 *
 * @type {exports}
 */

var _ = require( 'lodash' );
var mongoose = require( 'mongoose' );
var bcrypt = require( 'bcrypt' );

exports.clearDB = function( app, callback ){
    var models = _.keys( app.db.models );

    function empty(){
        var current = models.pop();

        app.db.models[ current ].remove( {}, function( err ){
            if( err ){
                callback( err );
            }
            else if( models.length > 0 ){
                empty();
            }
            else{
                callback();
            }
        } );
    }

    empty();
};

exports.initInquiries = function( callback ){
    var Inquiry = mongoose.model( 'Inquiry' );
    var inquiries = _.clone( Inquiry.defaults );

    function saveInquiries(){
        var currentInquiry = inquiries.pop();

        var newInquiry = new Inquiry( currentInquiry );
        newInquiry.save( function( err, inquiry, numberAffected ){
            if( err ){
                callback( err );
            }
            else{
                if( inquiries.length > 0 ){
                    saveInquiries();
                }
                else{
                    callback();
                }
            }
        } );
    };

    saveInquiries();
};

exports.initDocumentTypes = function( callback ){
    var DocumentType = mongoose.model( 'DocumentType' );
    var documentTypes = DocumentType.getDefaults();

    function saveDocumentType(){
        var currentDocumentType = documentTypes.pop();

        var newDocumentType = new DocumentType( currentDocumentType );
        newDocumentType.save( function( err, documentType, numberAffected ){
            if( err ){
                callback( err );
            }
            else{
                if( documentTypes.length > 0 ){
                    saveDocumentType();
                }
                else{
                    callback();
                }
            }

        } );
    };

    saveDocumentType();
};

exports.initUser = function( callback ){
    var _this = this;

    var salt = bcrypt.genSaltSync( 10 );
    var hash = bcrypt.hashSync( _this.defaults.user.hash, salt );

    var User = mongoose.model( 'User' );
    var user = new User( {
        "_id": _this.defaults.user._id,
        "email": _this.defaults.user.email,
        "hash": hash
    } );

    user.save( function( err, user ){
        if( err ){
            callback( err );
        }
        else{
            callback();
        }
    } );
};

exports.initRegistration = function( callback ){
    var _this = this;

    var Registration = mongoose.model( 'Registration' );

    var registration = new Registration( _this.defaults.registration );

    registration.save( function( err, registration ){
        if( err ){
            callback( err );
        }
        else{
            callback();
        }
    } );
};

exports.initToken = function( callback ){
    var _this = this;
    var jwt = require( 'jwt-simple' );
    var secretConfig = require( '../../config/config.json' ).secrets;
    var moment = require( 'moment-timezone' );
    var ttl = 24 * 60 * 60;
    var expDate = moment.utc().add( ttl, 'seconds' ).format();

    var Token = mongoose.model( 'Token' );

    var payload = {
        _id: _this.defaults.user._id,
        email: _this.defaults.user.email,
        ip: _this.defaults.registration.ip
    };

    var token = new Token( {
        data: jwt.encode( payload, secretConfig ),
        expires: expDate
    } );

    token.save( function( err ){
        if( err ){
            callback( err );
        }
        else{
            _this.defaults.token = token;
            _this.defaults.accessToken = token.data;
            callback();
        }
    } );
};

exports.initializeDB = function( callback ){
    var _this = this;

    _this.initUser( function( err ){
        if( err ){
            callback( err );
        }
        else{
            _this.initRegistration( function( err ){
                if( err ){
                    callback( err );
                }
                else{
                    _this.initToken( function( err ){
                        if( err ){
                            callback( err );
                        }
                        else{
                            callback();
                        }
                    } );
                }
            } );
        }
    } );
};

exports.initPendingEmailVerfication = function( callback ){
    var _this = this;

    var EmailVerification = mongoose.model( 'EmailVerification' );
    var email = new EmailVerification( _this.defaults.emailVerification );

    email.save( function( err ){
        if( err ){
            callback( err );
        }
        else{
            callback();
        }
    } );
};

exports.initCompleteEmailVerfication = function( callback ){
    var _this = this;

    var EmailVerification = mongoose.model( 'EmailVerification' );
    var emailVerification = _.clone( _this.defaults.emailVerification );
    emailVerification.status = 1;

    var email = new EmailVerification( emailVerification );
    email.save( function( err ){
        if( err ){
            callback( err );
        }
        else{
            callback();
        }
    } );
};

exports.initPendingPasswordRecovery = function( callback ){
    var _this = this;

    var PasswordRecovery = mongoose.model( 'PasswordRecovery' );
    var passwordRecovery = _.clone( _this.defaults.passwordRecovery );

    var passwordObj = new PasswordRecovery( passwordRecovery );
    passwordObj.save( function( err ){
        if( err ){
            callback( err );
        }
        else{
            callback();
        }
    } );
};

exports.initPendingExpiredPasswordRecovery = function( callback ){
    var _this = this;

    var PasswordRecovery = mongoose.model( 'PasswordRecovery' );
    var passwordRecovery = _.clone( _this.defaults.passwordRecovery );
    var expiredDate = new Date( Date.now() - 901000 ); // 15:01 min in the past
    passwordRecovery.created = expiredDate;

    var passwordObj = new PasswordRecovery( passwordRecovery );
    passwordObj.save( function( err ){
        if( err ){
            callback( err );
        }
        else{
            callback();
        }
    } );
};

exports.initCompletePasswordRecovery = function( callback ){
    var _this = this;

    var PasswordRecovery = mongoose.model( 'PasswordRecovery' );
    var passwordRecovery = _.clone( _this.defaults.passwordRecovery );
    passwordRecovery.status = 1;

    var passwordObj = new PasswordRecovery( passwordRecovery );
    passwordObj.save( function( err ){
        if( err ){
            callback( err );
        }
        else{
            callback();
        }
    } );
};

exports.initPendingInvitation = function( callback ){
    var _this = this;

    var Invitation = mongoose.model( 'Invitation' );
    var invitation = _.clone( _this.defaults.invitation );

    var salt = bcrypt.genSaltSync( 10 );
    var uuid = bcrypt.hashSync( _this.defaults.invitation.uuid, salt );
    invitation.uuid = uuid;

    var invitationObj = new Invitation( invitation );
    invitationObj.save( function( err ){
        if( err ){
            callback( err );
        }
        else{
            callback();
        }
    } );
};

exports.initCompleteInvitation = function( callback ){
    var _this = this;

    var Invitation = mongoose.model( 'Invitation' );
    var invitation = _.clone( _this.defaults.invitation );

    var salt = bcrypt.genSaltSync( 10 );
    var uuid = bcrypt.hashSync( _this.defaults.invitation.uuid, salt );
    invitation.uuid = uuid;
    invitation.status = 2;

    var invitationObj = new Invitation( invitation );
    invitationObj.save( function( err ){
        if( err ){
            callback( err );
        }
        else{
            callback();
        }
    } );
};