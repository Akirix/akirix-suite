var request = require( 'request' );
var config = require( '../config/config.json' );
var UberException = require( '../models_uber' ).UberException;
var queues = config.amqp.queues;
var amlConfig = config.aml_api;
var Promise = require( 'promise' );
var logger = require( '../lib/akx.logger' );

var util = require( '../lib/akx.util.js' );
var akxStrings = require( 'akx-strings' )();
var transports = require( '../config/config.json' ).akxLogger.transports;
var currentFileName = __filename.split( '/' ).pop();
var akxLogger = require( 'logger' )( currentFileName, transports );



exports.qMatchAML = function( queueName, msg, modelName ){
    return new Promise( function( resolve, reject ){
        if( modelName ){
            var dataParams = {};
            if( modelName === 'wire' ){
                dataParams[ 'name' ] = msg.account_holder + ' ' + msg.bank_name;
            }
            else if( modelName === 'registration' ){
                if( msg.account_type === 'business' ){
                    dataParams[ 'name' ] = msg.company.name;
                    dataParams[ 'identification' ] = msg.company.tax_num + ',' + msg.company.duns_number;
                }
                else{
                    dataParams[ 'name' ] = msg.user.first_name + ' ' + msg.user.last_name;
                    dataParams[ 'identification' ] = msg.user.id_num;
                }
            }
            else{
                return reject();
            }

            request( {
                    method: "POST",
                    url: amlConfig.host,
                    headers: {
                        Authorization: 'Bearer ' + amlConfig.apiKey
                    },
                    json: { data: dataParams },
                    timeout: 60000
                }, function( err, response, body ){
                    if( !!err ){
                        akxLogger.error( err, null, null, { queueName: queueName, msg: msg, modelName: modelName, response: response } );
                        reject();
                    }
                    else if( response.statusCode !== 200 ){
                        akxLogger.error( err, null, null, { queueName: queueName, msg: msg, modelName: modelName, response: response } );
                        reject();
                    }
                    else if( body.hits.length > 0 ){
                        akxLogger.info( body.hits.length + ' hits from aml-api for ' + modelName + ' ' + msg.id );
                        var promises = [];
                        body.hits.forEach( function( hit ){
                            var newException = UberException.build( {
                                model: modelName,
                                model_id: msg.id,
                                raw_data: JSON.stringify( hit )
                            } );
                            promises.push( newException.save().then( function(){
                                akxLogger.info( akxStrings.created( 'uber-exception', newException.id ), null,
                                    [
                                        { model: 'uber-exception', model_id: newException.id }
                                    ],
                                    { queueName: queueName, msg: msg, modelName: modelName }
                                );
                            } ) );
                        } );
                        Promise.all( promises ).then( function(){
                            resolve( true );
                        } )
                    }
                    else{
                        akxLogger.info( 'no aml-api match for ' + modelName + ' ' + msg.id );
                        resolve( false );
                    }
                }
            )
        }
        else{
            akxLogger.error( new Error( 'Missing model name' ), null, null, { queueName: queueName, msg: msg, modelName: modelName } );
            reject();
        }
    } );
};
