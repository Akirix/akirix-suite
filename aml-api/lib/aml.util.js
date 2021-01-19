var logger = require( './aml.logger.js' );
var _ = require( 'lodash' );
_.mixin( require( 'lodash-deep' ) );
var _this = this;

exports.handleError = function( log, err, req, res ){
    var logMsg = '';
    if( err instanceof Error ){
        logMsg = err.message;
    }
    else{
        var errors = [];
        for( var property in err ){
            if( err.hasOwnProperty( property ) ){
                var obj = {};
                obj[ property ] = err[ property ];
                errors.push( obj );
            }
        }
        console.log( errors );
        logMsg = JSON.stringify( errors );

        logger.info( log, 'Validation error: ' + logMsg, {
            req: req
        } );
    }
    logger.critical( logMsg, { req: req } );
    return res.send( 500, { errors: [ 'An internal error has occurred' ] } );
};

/**
 * General sanitizer
 * This function will trim String params and replace empty strings with NULL
 */
exports.sanitizeGeneral = function( req, res, next ){

    function sanitize( value ){
        value = value.trim();
        if( value === "" ){
            return null;
        } else{
            return value;
        }
    }

    function walk( node ){
        var end = true;

        _.forEach( node, function( value, key ){
            if( _.isString( value ) ){
                node[ key ] = sanitize( value );
            }
            else if( _.isObject( value ) || _.isArray( value ) ){
                end = false;
                walk( value );
            }
        } );

        if( end ){
            return next();
        }
    }

    if( !_.isEmpty( req.params ) ){
        walk( req.params );
    }
    else{
        return next();
    }
};

exports.sanitize = function(){
    var operations = [ _this.sanitizeGeneral ];
    return operations;
};

exports.handleValidationErrors = function( req, res ){

    var errors = {};
    _.forEach( req.validationErrors, function( value ){
        if( _.isArray( errors[ value.param ] ) ){
            errors[ value.param ].push( value.response );
        }
        else{
            errors[ value.param ] = [ value.response ];
        }
    } );

    var result = [];
    _.forEach( errors, function( value, key ){
        var error = {};
        error[ key ] = value;
        result.push( error );
    } );

    res.send( 400, { errors: result } );
};