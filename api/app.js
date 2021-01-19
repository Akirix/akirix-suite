var restify = require( 'restify' );
var restifyValidation = require( 'restify-validation' );
var passport = require( 'passport' );
var moment = require( 'moment-timezone' );
var db = require( './models' );
var logger = require( './lib/akx.logger.js' );
var util = require( './lib/akx.util.js' );
var winston = require( 'winston' );
var config = require( './config/config.json' );
var amqp = require( 'amqplib' );
var fs = require( 'fs' );

var transports = require( './config/config.json' ).akxLogger.transports;
var akxStrings = require( 'akx-strings' )();
var currentFileName = __filename.split( '/' ).pop();
var akxLogger = require( 'logger' )( currentFileName, transports );

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

restify.CORS.ALLOW_HEADERS.push( 'authorization' );

server.on( 'uncaughtException', function( req, res, route, error ){
    akxLogger.critical( error, req, null, route );
} );

db.sequelize.sync( { force: false } )
    .complete( function( err ){
        if( err ){
            throw err;
        }
        else{
            server.listen( config.base.port, function(){
                console.log( config.base.name + ' listening on port ' + config.base.port );
            } );
        }
    } );

amqp.connect( config.amqp )
    .then( function( conn ){
        return conn.createChannel();
    } )
    .then( function( ch ){
        var akxMq = require( './lib/akx.mq' );
        akxMq.joinChannel( ch );
        require( './lib/passport' )( passport );
        require( './lib/routes' )( server, passport );
    } )
    .catch( function( err ){
        throw err;
    } );
