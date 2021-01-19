var amqpConfig = require( '../config/config.json' ).amqp;
var transports = require( '../config/config.json' ).akxLogger.transports;
var currentFileName = __filename.split( '/' ).pop();
var akxLogger = require( 'logger' )( currentFileName, transports );
var _this = this;

exports.joinChannel = function( ch ){
    _this.ch = ch;
};

exports.sendWireToQueue = function( req, res, next ){
    if( res._body.wire && res._body.wire.dataValues.type === 0 ){
        _this.ch.assertQueue( amqpConfig.queue_wires, { durable: true } ).then( function(){
            akxLogger.info( 'adding W-' + res._body.wire.dataValues.name + ' to queue', req );
            _this.ch.sendToQueue( amqpConfig.queue_wires, new Buffer( JSON.stringify( res._body.wire.dataValues ) ), { persistent: true } );
            return next();
        } ).catch( function( err ){
            throw err;
        } );
    }
    else{
        return next();
    }
};