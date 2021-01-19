

var _ = require( 'lodash' );
var bcrypt = require( 'bcryptjs' );
var moment = require( 'moment-timezone' );
var db = require( '../models' );
var User = db.User;
var UserSetting = db.UserSetting;

var logger = require( '../lib/akx.logger.js' );
var notifier = require( '../lib/akx.notifier.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;





exports.handleError = function( err, req, res ){
    util.handleError( 'user', err, req, res );
};






exports.index = function( req, res, next ){

    UserSetting.findAll( {
            where: {
                user_id: req.user.id
            }
        } )
        .done( function( err, userSettings ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !userSettings ){
                res.send( 404, { errors: [ 'User setting not found' ] } );
                return next();
            }
            else{
                res.send( 200, { userSettings: userSettings } );
                return next();
            }
        } );
};







exports.view = function( req, res, next ){

    req.assert( 'user_setting_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        UserSetting.find( {
                where: {
                    id: req.params.user_setting_id,
                    user_id: req.user.id
                }
            } )
            .done( function( err, userSetting ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !userSetting ){
                    res.send( 404 );
                    return next();
                }
                else{
                    res.send( 200, { userSetting: userSetting } );
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

    req.assert( 'user_setting_id', 'isString' );
    req.assert( 'userSetting', 'isObject' );

    if( _.isEmpty( req.validationErrors ) ){
        UserSetting.find( {
                where: {
                    id: req.params.user_setting_id,
                    user_id: req.user.id
                }
            } )
            .done( function( err, userSetting ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !userSetting ){
                    res.send( 404 );
                    return next();
                }
                else{
                    for( var key in req.body.userSetting ){
                        if( key !== 'id' && key !== 'user_id' ){
                            userSetting[ key ] = req.body.userSetting[ key ]
                        }
                    }

                    userSetting.save().done( function( err ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else{
                            logger.log( 'user-setting', 'user: ' + req.user.id + ' updated their user settings', {
                                req: req,
                                model: 'user-setting',
                                model_id: userSetting.id
                            } );
                            res.send( 200, { userSetting: userSetting } );
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