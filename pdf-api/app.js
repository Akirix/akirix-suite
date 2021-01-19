var restify = require( 'restify' );
var restifyValidation = require( 'restify-validation' );
var moment = require( 'moment-timezone' );

var logger = require( './lib/akx.logger.js' );
var util = require( './lib/akx.util.js' );
var winston = require( 'winston' );
var config = require( './config/config.json');
var fs = require( 'fs' );

if( typeof process.env.NODE_ENV === 'undefined' ){
    process.env.NODE_ENV = 'production';
}

console.log( 'Launching in ' + process.env.NODE_ENV + ' mode' );

for( var i = 0; i < logger.logs.length; i++ ){
    var transportOptions = {
        filename: './log/' + logger.logs[ i ] + '.log',
        maxsize: 1000000000,
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
            new winston.transports.Console()
        ]
    } );

    winston.loggers.loggers[ logger.logs[ i ] ].setLevels( logger.levels );
}

var restify_config = {
    name: config.base.name,
    version: config.base.version
};

var server = restify.createServer( restify_config );

server.use( restify.acceptParser( server.acceptable ) );
server.use( restify.queryParser() );
server.use( restify.bodyParser() );
server.use( restify.authorizationParser() );
server.use( restify.CORS() );
server.use( restify.fullResponse() );
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

restify.CORS.ALLOW_HEADERS.push( 'x-requested-with' );
restify.CORS.ALLOW_HEADERS.push( 'cache-control' );

server.listen( config.base.port, function(){
    console.log( config.base.name + ' listening on port ' + config.base.port );

    process.on( 'exit', function( code ){
        global.ph.exit();
    } );
} );


require( './lib/routes' )( server );
