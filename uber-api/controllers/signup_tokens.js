var _ = require( 'lodash' );
var moment = require( 'moment-timezone' );
var mongoose = require( 'mongoose' );
var bcrypt = require( 'bcryptjs' );
var jwt = require( 'jwt-simple' );
var Token = mongoose.model( 'Token' );

var signupSecret = require( '../config/config.json' ).secrets.signup;
var logger = require( '../lib/akx.logger.js' );
var notifier = require( '../lib/akx.notifier.js' );
var util = require( '../lib/akx.util.js' );
var signupUser = mongoose.model( 'User' );
var signupToken = mongoose.model( 'Token' );
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'onboarding', err, req, res );
};

exports.create = function( req, res, next ){

    req.assert( 'user_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        signupUser.findOne( {
                _id: mongoose.Types.ObjectId( req.params.user_id )
            },
            function( err, user ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !user ){
                    res.send( 400, {
                        errors: [
                            { user_id: [ 'Cannot find user' ] }
                        ]
                    } );
                    return next();
                }
                else{

                    var ttl = 24 * 60 * 60;
                    var payload = {
                        _id: user._id,
                        email: user.email,
                        ttl: ttl
                    };

                    var expDate = moment.utc().add( ttl, 'seconds' ).format();

                    var tokenData = {
                        data: jwt.encode( payload, signupSecret ),
                        expires: expDate
                    };

                    var newToken = new signupToken( tokenData );
                    newToken.save( function( err ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else{
                            res.send( 201, { token: newToken } );
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