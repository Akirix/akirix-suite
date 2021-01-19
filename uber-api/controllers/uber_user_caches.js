var UberUserCache = require( '../models_redis/UberUserCache' );
var util = require( '../lib/akx.util' );
var _ = require( 'lodash' );
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'uber-user-cache', err, req, res );
};



exports.view = function( req, res, next ){

    if( req.user.id === req.params.uber_user_id ){
        UberUserCache.find( req.user.id ).then( function( uberUserCache ){
            res.send( 200, { uberUserCache: uberUserCache.data } );
            return next();
        } ).catch( function( err ){
            _this.handleError( err, req, res );
            return next();
        } );
    }
    else{
        res.send( 404 );
        return next();
    }
};




exports.update = function( req, res, next ){
    req.assert( 'uberUserCache', 'isObject' );

    if( _.isEmpty( req.validationErrors ) ){
        UberUserCache.find( req.user.id )
            .then( function( uberUserCache ){
                req.body.uberUserCache.id = req.user.id;
                uberUserCache.data = req.body.uberUserCache;
                return uberUserCache.save();
            } )
            .then( function( data ){
                res.send( 200, { uberUserCache: data } );
                return next();
            } )
            .catch( function( err ){
                _this.handleError( err, req, res );
                return next();
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};