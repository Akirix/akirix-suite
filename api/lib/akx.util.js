var logger = require( './akx.logger.js' );
var _ = require( 'lodash' );
_.mixin( require( 'lodash-deep' ) );
var isError = require( 'lodash.iserror' );
var validator = require( 'validator' );
var _this = this;
var akxStrings = require( 'akx-strings' )();

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

//exports.handleValidationErrors = function( req, res ){
//
//    var errors = {};
//    _.forEach( req.validationErrors, function( value ){
//        if( _.isArray( errors[ value.param ] ) ){
//            errors[ value.param ].push( value.response );
//        }
//        else{
//            errors[ value.param ] = [ value.response ];
//        }
//    } );
//
//    var result = [];
//    _.forEach( errors, function( value, key ){
//        var error = {};
//        error[ key ] = value;
//        result.push( error );
//    } );
//
//    res.send( 400, { errors: result } );
//};

// Incremental Deployment for handleValidationErrors, eventually the if conditional on line 101 will be un-needed
// as everything will be using the akxLogger, so it will be passed into the function
exports.handleValidationErrors = function( req, res, akxLogger ){
    if( !_.isEmpty( akxLogger ) ){
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
            if( !!akxLogger ){
                akxLogger.error( (key + ' ' + value), req, [ { key: key, value: value } ], result );
            }
            result.push( error );
        } );
    }
    else{
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
    }
    return res.send( 400, { errors: result } );
};


exports.handleLibError = function( err, req, res, akxLogger ){
    if( !_.isEmpty( akxLogger ) ){
        if( isError( err ) ){
            akxLogger.error( err, req );
        }
        else if( _.isString( err ) ){
            akxLogger.error( new Error( err ), req );
        }
        else{
            akxLogger.error( new Error( JSON.stringify( err ) ), req );
        }
    }
    if( !res.headersSent ){
        return res.send( 500, { errors: [ akxStrings.INTERNAL_ERROR ] } );
    }
};