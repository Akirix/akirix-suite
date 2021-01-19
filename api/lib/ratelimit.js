var ExpressMiddleware = require( 'ratelimit.js' ).ExpressMiddleware;
var RateLimit = require( 'ratelimit.js' ).RateLimit;
var _ = require( 'lodash' );
var logger = require( './akx.logger.js' );

function AkxRateLimit( redisClient ){
    var options = {
        ignoreRedisErrors: true // defaults to false
    };

    this.LimitLowMiddleware = new ExpressMiddleware( new RateLimit( redisClient,
        [ {
            interval: 60,
            limit: 20
        } ]
    ), options );

    this.LimitMidMiddleware = new ExpressMiddleware( new RateLimit( redisClient,
        [ {
            interval: 60,
            limit: 120
        } ]
    ), options );

    var akxExtractIps = function( req ){
        if( _.isObject( req.headers ) && _.isString( req.headers[ 'x-real-ip' ] ) ){
            return req.headers[ 'x-real-ip' ] + ' ';
        }
        else if( _.isObject( req.connection ) && _.isString( req.connection.remoteAddress ) ){
            return req.connection.remoteAddress;
        }
    };

    var akxWeight = function(){
        return 1;
    };

    this.limitPayment = this.LimitLowMiddleware.middleware( { extractIps: akxExtractIps, weight: akxWeight }, function( req, res, next ){
        if( !req.headers.hasOwnProperty( 'x-override-ratelimit' ) ){
            logger.error( 'security', 'Rate limit reached (Low)', {
                req: req
            } );
            res.send( 429, { errors: [ 'Too Many Requests' ] } );
        }
        else{
            next();
        }
    } );
    this.limitLow = this.LimitLowMiddleware.middleware( { extractIps: akxExtractIps, weight: akxWeight }, function( req, res, next ){
        if( !req.headers.hasOwnProperty( 'x-override-ratelimit' ) ){
            logger.error( 'security', 'Rate limit reached (Low)', {
                req: req
            } );
            res.send( 429, { errors: [ 'Too Many Requests' ] } );
        }
        else{
            next();
        }
    } );
    this.limitMid = this.LimitMidMiddleware.middleware( { extractIps: akxExtractIps, weight: akxWeight }, function( req, res, next ){
        if( !req.headers.hasOwnProperty( 'x-override-ratelimit' ) ){
            logger.error( 'security', 'Rate limit reached (Mid)', {
                req: req
            } );
            res.send( 429, { errors: [ 'Too Many Requests' ] } );
        }
        else{
            next();
        }
    } );
}

module.exports = AkxRateLimit;
