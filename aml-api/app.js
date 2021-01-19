var restify = require( 'restify' );
var restifyValidation = require( 'restify-validation' );
var passport = require( 'passport' );
var moment = require( 'moment-timezone' );
var logger = require( './lib/aml.logger.js' );
var util = require( './lib/aml.util.js' );
var winston = require( 'winston' );
var db = require( './models' );
var config = require( './config/config.json' );


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

var server = restify.createServer( {
    name: config.base.name,
    version: config.base.version
} );


server.use( restify.acceptParser( server.acceptable ) );
server.use( restify.queryParser() );
server.use( restify.bodyParser() );
server.use( restify.authorizationParser() );
server.use( restify.CORS() );
server.use( restify.fullResponse() );
server.use( util.sanitize() );
server.use( restifyValidation() );

restify.CORS.ALLOW_HEADERS.push( 'authorization' );

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

db.sequelize.sync( { force: false } ).then( function(){
    server.listen( config.base.port, function(){
        console.log( config.base.name + ' listening on port ' + config.base.port );
    } );
} ).catch( function( err ){
    _this.handleError( err );
} );

require( './config/passport' )( passport );
require( './config/routes' )( server, passport );
