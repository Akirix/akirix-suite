var _ = require( 'lodash' );
var request = require( 'request' );
var msgConfig = require( '../config/config.json' ).msg_api;

var logger = require( './akx.logger.js' );

var mandrillKey = msgConfig.mandrillApiKey;

var _this = this;

exports._sendEmail = function( template_name, email, data, callback ){
    var formData = {
        template_name: template_name,
        email: email,
        data: data,
        key: mandrillKey
    };

    request.post( {
        url: msgConfig.host + '/emails',
        json: formData
    }, function( err, response, body ){
        if( err ){
            logger.raw( 'email', 'Failed to send to ' + email, {} );
            callback( err );
        }
        else{
            if( response.statusCode === 200 || response.statusCode === 201 ){
                callback( null, body );
            }
            else{
                callback( body );
            }

            logger.raw( 'email', template_name + ' email sent to ' + email, {} );
        }
    } );
};

exports.sendEmail = function(){
    if( !_.isString( arguments[ 0 ] ) || !_.isString( arguments[ 1 ] ) ){
        throw new Error( 'Missing params' );
    }
    else{

        if( _.isFunction( arguments[ 2 ] ) ){
            return _this._sendEmail( arguments[ 0 ], arguments[ 1 ], {}, arguments[ 2 ] );
        }
        else if( _.isObject( arguments[ 2 ] ) && _.isFunction( arguments[ 3 ] ) ){
            return _this._sendEmail( arguments[ 0 ], arguments[ 1 ], arguments[ 2 ], arguments[ 3 ] );
        }
        else{
            throw new Error( 'Missing params' );
        }
    }
};