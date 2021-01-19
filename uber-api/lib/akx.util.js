var logger = require( './akx.logger.js' );
var _ = require( 'lodash' );
var isError = require( 'lodash.iserror' );
_.mixin( require( 'lodash-deep' ) );
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

exports.handleLibScriptError = function( err, akxLogger, lockFile, lockFileName ){
    if( isError( err ) ){
        akxLogger.error( err );
    }
    else if( _.isString( err ) ){
        akxLogger.error( new Error( err ) );
    }
    else{
        akxLogger.error( new Error( JSON.stringify( err ) ) );
    }

    if( lockFile && lockFileName ){
        lockFile.unlock( lockFileName, function( lockErr ){
            if( lockErr ){
                if( isError( lockErr ) ){
                    akxLogger.error( lockErr );
                }
                else if( _.isString( lockErr ) ){
                    akxLogger.error( new Error( lockErr ) );
                }
                else{
                    akxLogger.error( new Error( JSON.stringify( lockErr ) ) );
                }
            }
            akxLogger.flushAndExit( 1 );
        } );
    }
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

exports.isEmail = function( value ){
    var emailRegex = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
    return _.isString( value ) && emailRegex.test( value );
};

exports.handleValidationErrors = function( req, res, akxLogger ){
    if( akxLogger ){
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
                akxLogger.error( ( key + ' ' + value ), req, [ { key: key, value: value } ], result );
            }
            result.push( error );
        } );

        return res.send( 400, { errors: result } );
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

        res.send( 400, { errors: result } );
    }
};