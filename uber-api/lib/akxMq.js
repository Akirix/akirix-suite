var mqConfig = require( '../config/config.json' ).amqp;
var logger = require( './akx.logger' );

var aml = require( '../controllers/aml' );
var uber_mon_rules = require( '../controllers/uber_mon_rules' );
var wires = require( '../controllers/wires' );

var util = require( './akx.util.js' );
var transports = require( '../config/config.json' ).akxLogger.transports;
var currentFileName = __filename.split( '/' ).pop();
var akxLogger = require( 'logger' )( currentFileName, transports );

function AkxMqMiddlware(){
    var self = this;
    mqConfig.queues = {
        "wires.out.new": {
            durable: true,
            model: 'wire',
            filters: [ uber_mon_rules.qMatchUberMonRules, aml.qMatchAML, wires.qMatchFirstWires, wires.qMatchFirstTimeBeneficiary, wires.qMatchInactiveCompanyTransactions ],
            matchHandler: wires.qHoldWire,
            noMatchHandler: wires.qReleaseWire
        },
        "wires.in.new": {
            durable: true,
            model: 'wire',
            filters: [ uber_mon_rules.qMatchUberMonRules ],
            matchHandler: wires.qHoldWire,
            noMatchHandler: wires.qReleaseWire
        }
        //"registrations.new": {
        //    durable: true,
        //    filters: [ uber_monRules.checkUberMonRules, aml.checkAML ]
        //}
    };

    this.akxMq = require( 'akx-mq' )( mqConfig );
    var getMessage = function( req, res ){
        if( res._body.wire && res._body.wire.dataValues.type !== 2 ){
            akxLogger.info( 'adding W-' + res._body.wire.dataValues.name + ' to queue', req );
            return JSON.stringify( res._body.wire.dataValues );
        }
        else{
            return null;
        }
    };

    var callback = function( err, req, res, next ){
        if( !!err ){
            util.handleLibError( err, req, res, akxLogger );
        }
        return next();
    };

    this.addWireToQueue = function( req, res, next ){
        if( res._body.hasOwnProperty( 'wire' ) && res._body.wire.dataValues.type === 0 ){
            self.akxMq.publishMiddleware( { queue: 'wires.out.new', getMessage: getMessage, callback: callback } )( req, res, next );
        }
        else if( res._body.hasOwnProperty( 'wire' ) && res._body.wire.dataValues.type === 1 ){
            self.akxMq.publishMiddleware( { queue: 'wires.in.new', getMessage: getMessage, callback: callback } )( req, res, next );
        }
        else{
            return next();
        }
    };
}

module.exports = AkxMqMiddlware;
