var _ = require( 'lodash' );
var UAParser = require( 'ua-parser-js' );
var moment = require( 'moment-timezone' );

var db = require( '../models' );
var AccessLog = db.AccessLog;
var transports = require( '../config/config.json' ).akxLogger.transports;
var currentFileName = __filename.split( '/' ).pop();
var akxLogger = require( 'logger' )( currentFileName, transports );
var util = require( '../lib/akx.util.js' );

exports.addEntry = function( req, res, next ){
    var IPaddress = '';
    var parser = new UAParser;
    var userAgent = parser.setUA( req.headers[ 'user-agent' ] ).getResult();

    if( !_.isEmpty( req.headers[ 'x-real-ip' ] ) ){
        IPaddress = req.headers[ 'x-real-ip' ];
    }
    else if( !_.isEmpty( req.connection.remoteAddress ) ){
        IPaddress += req.connection.remoteAddress;
    }

    // Only record if same user_id, IP & UA have not appeared today
    AccessLog.count( {
        where: {
            user_id: req.user.id,
            ip: IPaddress,
            user_agent: req.headers[ 'user-agent' ],
            created_at: { gte: moment.utc().format( 'YYYY-MM-DD 00:00:00' ) }
        }
    } ).then( function( c ){
        if( c === 0 ){
            return AccessLog.create( {
                user_id: req.user.id,
                ip: IPaddress,
                user_agent: req.headers[ 'user-agent' ],
                browser: userAgent.browser[ 'name' ],
                browser_version: userAgent.browser[ 'version' ],
                os: userAgent.os[ 'name' ],
                os_version: userAgent.os[ 'version' ],
                device: userAgent.device[ 'model' ]
            } )
        }
    } ).then( function(){
        return next();
    } ).catch( function( err ){
        return util.handleLibError( err, req, res, akxLogger )
    } )
};