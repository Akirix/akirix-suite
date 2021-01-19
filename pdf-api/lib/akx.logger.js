var winston = require( 'winston' );
var moment = require( 'moment-timezone' );
var _ = require( 'lodash' );
var _this = this;

exports.levels = {
    info: 0,
    error: 1,
    critical: 2
};

exports.logs = [
    'pdf',
    'error'
];

exports.getCaller = function(){
    try{
        var orig = Error.prepareStackTrace;

        Error.prepareStackTrace = function( _, stack ){
            return stack;
        };

        var err = new Error;

        Error.captureStackTrace( err, arguments.callee );

        var stack = err.stack;

        Error.prepareStackTrace = orig;

        var currentFile = stack.shift().getFileName();

        for( var i = 0; i < stack.length; i++ ){
            var file = stack[i].getFileName();
            if( file !== currentFile ){

                return {
                    file: stack[i].getFileName(),
                    lineNumber: stack[i].getLineNumber()
                };
            }
        }
    }
    catch( err ){
        return undefined;
    }

};

exports.metaLog = function( message ){
    var logMessage = moment().format( 'YYYY-MM-DD HH:mm:ss' ) + ' ';

    logMessage += message + ' ';

    var caller = _this.getCaller();
    var err = new Error();
    logMessage += '\nFile: ' + caller.file + ':' + caller.lineNumber + '\n' + err.stack;

    var logger = winston.loggers.get( 'error' );
    logger.log( 'critical', logMessage );
};

exports.log = function( logType, message, options ){
    var defaults = {
        level: 'info',
        message: message,
        requestParams: false
    };

    var log = _.merge( defaults, options );

    // Check to see if the logType is valid type
    if( _.indexOf( _this.logs, logType ) !== -1 ){

        // Time
        var logMessage = moment().format( 'YYYY-MM-DD HH:mm:ss' ) + ' ';

        if( _.isObject( log.req ) ){

            // IP
            if( _.isObject( log.req.headers ) && _.isString( log.req.headers[ 'x-real-ip' ] ) ){
                logMessage += log.req.headers[ 'x-real-ip' ] + ' ';
            }
            else if( _.isObject( log.req.connection ) && _.isString( log.req.connection.remoteAddress ) ){
                logMessage += log.req.connection.remoteAddress + ' ';
            }

            // Route e.g. ``POST /users/:user_id``
            if( _.isObject( log.req.route ) ){

                if( _.isString( log.req.route.method ) ){
                    logMessage += log.req.route.method + ' ';
                }
                else{
                    _this.metaLog( 'Missing req.route.method param' );
                }

                if( _.isString( log.req.route.path ) ){
                    logMessage += log.req.route.path + ' ';
                }
                else if( _.isString( log.req.route.url ) ){
                    logMessage += log.req.route.url + ' ';
                }
                else{
                    _this.metaLog( 'Missing req.route.path param' );
                }
            }
            else{
                _this.metaLog( 'Missing req.connection param' );
            }

            if( _.isObject( log.req.user ) ){
                if( _.isString( log.req.user.admin_id ) ){
                    logMessage += 'admin[' + log.req.user.admin_id + '] ';
                }

                if( _.isString( log.req.user.name ) && _.isString( log.req.user.id ) && _.isString( log.req.user.company_id ) ){
                    logMessage += log.req.user.name + '[' + log.req.user.id + '][' + log.req.user.company_id + '] ';
                }
            }
        }
        else{
            _this.metaLog( 'Missing req param' );
        }

        // Description
        logMessage += '"' + log.message + '"';

        // Add file:line-number and stack trace for errors
        if( logType === 'error' ){
            log.level = 'critical';
            var caller = _this.getCaller();
            var err = new Error();
            logMessage += '\nFile: ' + caller.file + ':' + caller.lineNumber + '\n' + err.stack;
        }

        // Log the request params
        if( log.level === 'error' || log.level === 'critical' || log.requestParams === true ){
            if( _.isObject( log.req ) && _.isObject( log.req.params ) && !_.isEmpty( log.req.params ) ){
                logMessage += '\nRequest Params: ' + JSON.stringify( log.req.params, null, 2 );
            }
            else{
                _this.metaLog( 'Missing req param' );
            }
        }

        var logger = winston.loggers.get( logType );
        logger.log( log.level, logMessage );

    }
    else{
        _this.metaLog( 'index ' + logType + ' not found' );
    }
};

exports.info = function( logType, message, options ){
    if( _.isObject( options ) ){
        options['level'] = 'info';
    }
    else{
        options = {
            level: 'info'
        }
    }

    _this.log( logType, message, options );
};

exports.error = function( logType, message, options ){
    if( _.isObject( options ) ){
        options['level'] = 'error';
    }
    else{
        options = {
            level: 'error'
        }
    }

    _this.log( logType, message, options );
};

exports.critical = function( message, options ){
    if( _.isObject( options ) ){
        options['level'] = 'critical';
    }
    else{
        options = {
            level: 'critical'
        }
    }

    _this.log( 'error', moment().format( 'YYYY-MM-DD HH:mm:ss' ) + ' ' + message, options );
};

