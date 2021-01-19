var fs = require( 'fs' );
var mongoose = require( 'mongoose' );
var passport = require( 'passport' );
var winston = require( 'winston' );
var moment = require( 'moment-timezone' );
var restifyValidation = require( 'restify-validation' );
var _ = require( 'lodash' );

var util = require( './lib/akx.util.js' );
var config = require( './config/config.json' );

if( _.has( config, 'database' ) ){

    var logger = require( './lib/akx.logger.js' );

    // Configure winston logger
    for( var i = 0; i < logger.logs.length; i++ ){
        var transportOptions = {
            filename: './log/' + logger.logs[ i ] + '.log',
            maxsize: 128000000,
            json: false,
            timestamp: false,
            handleExceptions: false,
            exitOnError: false
        };

        if( logger.logs[ i ] === 'error' ){
            transportOptions.handleExceptions = true;
        }

        winston.loggers.add( logger.logs[ i ], {
            transports: [
                new winston.transports.DailyRotateFile( transportOptions ),
                new (winston.transports.Console)()
            ]
        } );

        winston.loggers.loggers[ logger.logs[ i ] ].setLevels( logger.levels );
    }

    console.log( 'Starting ' + config.base.name );

    // DB & Model
    dbconf = config.database;

    // Setup DB
    var mongodbConnection = 'mongodb://' + dbconf.hosts.join() + '/' + dbconf.database;
    var db = mongoose.connect( mongodbConnection, dbconf.options );


    var models_path = __dirname + '/models';
    var walk = function( path ){
        fs.readdirSync( path ).forEach( function( file ){
            var newPath = path + '/' + file;
            var stat = fs.statSync( newPath );
            if( stat.isFile() ){
                if( /(.*)\.(js$|coffee$)/.test( file ) ){
                    require( newPath );
                }
            } else if( stat.isDirectory() ){
                walk( newPath );
            }
        } );
    };
    walk( models_path );

    var restify_config = {
	    name: config.base.name,
	    version: config.base.version
	};

    // Restify
    var restify = require( 'restify' );
    var server = restify.createServer( restify_config );

    server.use( restify.acceptParser( server.acceptable ) );
    server.use( restify.queryParser() );
    server.use( restify.bodyParser() );
    server.use( restify.authorizationParser() );
    server.use( restify.CORS() );
    server.use( util.sanitize() );
    server.use( restifyValidation() );

    server.on( 'uncaughtException', function( req, res, route, error ){
        winston.loggers.get( 'error' ).log( 'critical', moment().format( 'YYYY-MM-DD HH:mm:ss' ) + ' ' + error.stack );
        winston.loggers.get( 'error' ).log( 'critical', moment().format( 'YYYY-MM-DD HH:mm:ss' ) + ' ' + req );
        winston.loggers.get( 'error' ).log( 'critical', moment().format( 'YYYY-MM-DD HH:mm:ss' ) + ' ' + route );
        winston.loggers.get( 'error' ).log( 'critical', moment().format( 'YYYY-MM-DD HH:mm:ss' ) + ' ' + res );
        winston.loggers.get( 'error' ).log( 'critical', moment().format( 'YYYY-MM-DD HH:mm:ss' ) + ' ' + error );

        console.log( '==== uncaughtException' );
        console.log( error );
        console.log( error.stack );
        console.log( '========' );
    } );

    restify.CORS.ALLOW_HEADERS.push( 'authorization' );
    restify.CORS.ALLOW_HEADERS.push( 'x-requested-with' );
    restify.CORS.ALLOW_HEADERS.push( 'cache-control' );

    require( './lib/passport' )( passport );
    require( './lib/routes' )( server, passport, db );

    server.listen( config.base.port, function(){
        console.log( config.base.name + ' listening on port ' + config.base.port );
    } );

    exports.server = server;
    exports.db = db;
}
else{
    throw new Error( 'Incorrect NODE_ENV configuration: ' + process.env.NODE_ENV );
}

