var db = require( '../models' );
var _ = require( 'lodash' );
var moment = require( 'moment-timezone' );

var Lock = db.Lock;
var User = db.User;
var Token = db.Token;

var notifier = require( '../lib/akx.notifier.js' );
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'user', err, req, res );
};

exports.index = function( req, res, next ){
    req.assert( 'user_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Lock.findAll( {
            where: {
                user_id: req.params.user_id
            },
            order: [
                [ 'status', 'DESC'],
                [ 'created_at', 'DESC']
            ]
        } )
            .done( function( err, locks ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !locks ){
                    res.send( 200, { locks: [] } );
                    return next();
                }
                else{
                    res.send( 200, { locks: locks } );
                    return next();
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.create = function( req, res, next ){
    req.assert( 'lock', 'isObject' );
    req.assert( 'lock.user_id', 'isString' );
    req.assert( 'lock.message', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        User.find( {
            where: {
                id: req.params.lock.user_id
            }
        } )
            .done( function( err, user ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !user ){
                    res.send( 404, {
                        errors: [
                            { user_id: [ 'Cannot find user' ] }
                        ]
                    } );
                    return next();
                }
                else{

                    var newLock = Lock.build( {
                        user_id: user.id,
                        message: req.params.lock.message,
                        status: 1,
                        uber_user_id: req.user.id
                    } );

                    newLock.save()
                        .done( function( err ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else{
                                res.send( 200, { lock: newLock } );
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

exports.delete = function( req, res, next ){

    req.assert( 'lock_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        Lock.find( {
            where: {
                id: req.params.lock_id
            }
        } )
            .done( function( err, lock ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !lock ){
                    res.send( 404, {
                        errors: [
                            { lock_id: [ 'Cannot find lock' ] }
                        ]
                    } );
                    return next();
                }
                else{
                    lock.status = 0;
                    lock.save().done( function( err ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else{
                            res.send( 200, {} );
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