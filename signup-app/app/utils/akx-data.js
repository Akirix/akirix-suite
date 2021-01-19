import Ember from 'ember';
import config from 'signup-app/config/environment';

export default Ember.Object.extend( {
    _sendRequest: function( endpoint, type, data ){
        return new Ember.RSVP.Promise( function( resolve, reject ){

            var settings = {
                url: config.APP.signup_api_host + endpoint,
                cache: false,
                dataType: 'json',
                type: type,
                contentType: 'application/json',
                success: function _sendRequestSuccess( data, textStatus, jqXHR ){
                    resolve( { data: data, textStatus: textStatus, jqXHR: jqXHR } );
                },
                error: function _sendRequestError( jqXHR, textStatus, errorThrown ){
                    reject( { jqXHR: jqXHR, textStatus: textStatus, errorThrown: errorThrown } );
                }
            };

            if( type !== 'get' && type !== 'delete' && !Ember.isEmpty( data ) ){
                if( typeof data.getJSON !== 'undefined' ){
                    settings[ 'data' ] = JSON.stringify( data.getJSON() );
                }
                else{
                    settings[ 'data' ] = JSON.stringify( data );
                }
            }

            Ember.$.ajax( settings );

        } );
    },

    sendRequest: function(){
        var result;
        var _this = this;

        switch( arguments.length ){
            case 1:
                result = _this._sendRequest( arguments[ 0 ], 'get', null );
                break;
            case 2:
                result = _this._sendRequest( arguments[ 0 ], arguments[ 1 ], null );
                break;
            case 3:
                result = _this._sendRequest( arguments[ 0 ], arguments[ 1 ], arguments[ 2 ] );
                break;
            default:
                throw new Error( 'Invalid number of arguments' );
        }
        return result;
    }
} );
