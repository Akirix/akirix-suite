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
    'account',
    'announcement',
    'authenticator',
    'auth',
    'company',
    'commission',
    'currency',
    'document',
    'email',
    'fund',
    'fx-request',
    'invoice',
    'login',
    'pdf',
    'project',
    'ticket',
    'transaction',
    'user',
    'user-setting',
    'wire',
    'wire-template',
    'error',
    'security',
    'slack'
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
    var logMessage = {
        timeStamp: moment().format( 'YYYY-MM-DD HH:mm:ss' )
    };

    logMessage[ 'message' ] = message;

    var caller = _this.getCaller();
    var err = new Error();
    logMessage[ 'reqParams' ] = '\nFile: ' + caller.file + ':' + caller.lineNumber + '\n' + err.stack;

    var logger = winston.loggers.get( 'error' );
    logger.log( 'critical', JSON.stringify( logMessage ) );
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
        var logMessage = {
            timeStamp: moment().format( 'YYYY-MM-DD HH:mm:ss' )
        };


        if( _.isObject( log.req ) ){

            // IP
            if( _.isObject( log.req.headers ) && _.isString( log.req.headers[ 'x-real-ip' ] ) ){
                logMessage[ 'Ip' ] = log.req.headers[ 'x-real-ip' ];
            }
            else if( _.isObject( log.req.connection ) && _.isString( log.req.connection.remoteAddress ) ){
                logMessage[ 'Ip' ] = log.req.connection.remoteAddress;
            }

            // Route e.g. ``POST /users/:user_id``
            if( _.isObject( log.req.route ) ){

                if( _.isString( log.req.route.method ) ){
                    logMessage[ 'method' ] = log.req.route.method;
                }
                else{
                    _this.metaLog( 'Missing req.route.method param' );
                }

                if( _.isString( log.req.route.path ) ){
                    logMessage[ 'endPoint' ] = log.req.route.path;
                }
                else if( _.isString( log.req.route.url ) ){
                    logMessage[ 'endPoint' ] = log.req.route.url;
                }
                else{
                    _this.metaLog( 'Missing req.route.path param' );
                }
            }
            else{
                _this.metaLog( 'Missing req.connection param' );
            }

            if( _.isObject( log.req.user ) ){
                // admin_id for logging impersonation
                if( _.isString( log.req.user.admin_id ) ){
                    logMessage[ 'admin_user' ] = 'admin[' + log.req.user.admin_id + '] ';
                }

                // Username and ids e.g. { user: john doe user_email user_id, company_id: user_company_id }
                if( _.isString( log.req.user.name ) && _.isString( log.req.user.id ) && _.isString( log.req.user.company_id ) ){
                    logMessage[ 'user' ] = log.req.user.name + ' ' + log.req.user.email + ' ' +log.req.user.id;
                    logMessage[ 'company_id' ] = log.req.user.company_id;
                }
            }
        }
        else{
            _this.metaLog( 'Missing req param' );
        }

        // Model && model id
        if( log.model && log.model_id ){
            logMessage[ 'model' ] = log.model;
            logMessage[ 'model_id' ] = log.model_id;
        }

        // Previous values
        if( log.previousValues ){
            logMessage[ 'previousValues'] = log.previousValues;
        }

        // Description
        logMessage[ 'message' ] = log.message;

        // Add file:line-number and stack trace for errors
        if( logType === 'error' ){
            log.level = 'critical';
            var caller = _this.getCaller();
            var err = new Error();
            logMessage[ 'stack' ] = '\nFile: ' + caller.file + ':' + caller.lineNumber + '\n' + err.stack;
        }

        // Log the request params
        if( log.level === 'error' || log.level === 'critical' || log.requestParams === true ){
            if( _.isObject( log.req ) && _.isObject( log.req.params ) && !_.isEmpty( log.req.params ) ){
                logMessage[ 'reqParams' ] = '\nRequest Params: ' + JSON.stringify( log.req.params, null, 2 );
            }
            else{
                _this.metaLog( 'Missing req param' );
            }
        }

        var logger = winston.loggers.get( logType );
        logger.log( log.level, JSON.stringify( logMessage ) );
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

