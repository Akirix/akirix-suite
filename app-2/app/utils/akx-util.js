import Ember from 'ember';
import config from 'akx-app/config/environment';
import _ from 'lodash';

export default Ember.Object.extend( {
    session: Ember.inject.service( 'session' ),
    store: Ember.inject.service( 'store' ),

    authAjax( options, endpoint ){
        let defaultOptions = {
            url: `${config.APP.api_host}${endpoint}`,
            cache: false,
            dataType: 'json',
            contentType: 'application/json; charset=utf-8'
        };
        return new Ember.RSVP.Promise( ( resolve )=>{
            let access_token = this.get( 'session.data.authenticated.access_token' );
            options[ 'headers' ] = {};
            options[ 'headers' ][ 'Authorization' ] = `Bearer ${access_token}`;
            resolve( Ember.$.ajax( _.merge( defaultOptions, options ) ) );
        } );
    },
    formatAjaxError( err ){
        // Check to see if responseJSON is empty, usually happens when api is offline
        if( !Ember.isEmpty( err ) && ( err.responseJSON || err.responseText ) ){
          const errorMessage = err.responseJSON ? err.responseJSON.errors.join( "\n" ) : err.responseText;
          return {
            errors: [ {
                errors: errorMessage,
                status: err.status
            } ]
          };
        }
        return {
            errors: [ {
                errors: 'Failed to connect to the server',
                status: 0
            } ]
        };
    },
    isTwoFactorAuthenticated(){
        return this.authAjax( {
            type: 'get'
        }, '/tokens/two_factor' );
    },
    formatEmberWay( data, model ){
        if( Ember.isEmpty( data ) ){
            return [];
        }
        return this.get( 'store' ).push( {
            data: data.map( ( item )=>{
                return {
                    id: item.id,
                    type: model,
                    attributes: item
                }
            } )
        } );
    },
    getWireFee: function( feeObj, wire ){
        var wireFeeTable = JSON.parse( feeObj.get( 'fee_data' ) )[ 'wire' ][ Ember.get( wire, 'currency_id' ) ];
        if( wireFeeTable.hasOwnProperty( Ember.get( wire, 'bank_country' ) ) ){
            wireFeeTable = wireFeeTable[ Ember.get( wire, 'bank_country' ) ];
        }
        else{
            wireFeeTable = wireFeeTable.default;
        }

        var wireFee = 0;
        var wirePercentFee = 0;

        // Out
        if( Ember.get( wire, 'type' ) === 0 ){
            if( Ember.get( wire, 'method' ) === 0 ){
                if( _.isObject( wireFeeTable.out_wire ) ){
                    _.forEach( wireFeeTable.out_wire, function( value, key ){
                        if( Ember.get( wire, 'amount' ) >= Number( key ) ){
                            wireFee = value;
                        }
                    } );
                }
                else{
                    wireFee = wireFeeTable.out_wire;
                }
            }
            else if( Ember.get( wire, 'method' ) === 1 ){
                wireFee = wireFeeTable.out_ach;
            }


            if( _.isObject( wireFeeTable.out_percent ) ){
                _.forEach( wireFeeTable.out_percent, function( value, key ){
                    if( Ember.get( wire, 'amount' ) >= Number( key ) ){
                        wirePercentFee = Math.round( Ember.get( wire, 'amount' ) * value, 2 );
                    }
                } );
            }
            else{
                wirePercentFee = Math.round( Ember.get( wire, 'amount' ) * wireFeeTable.out_percent, 2 );
            }

            if( Ember.get( wire, 'speedwire' ) ){
                wireFee += wireFeeTable.speedwire;
            }
        }
        // Inbound
        else if( Ember.get( wire, 'type' ) === 1 ){
            if( Ember.get( wire, 'method' ) === 0 ){
                if( _.isObject( wireFeeTable.in_wire ) ){
                    _.forEach( wireFeeTable.in_wire, function( value, key ){
                        if( Ember.get( wire, 'amount' ) >= Number( key ) ){
                            wireFee = value;
                        }
                    } );
                }
                else{
                    wireFee = wireFeeTable.in_wire;
                }
            }
            else if( Ember.get( wire, 'method' ) === 1 ){
                wireFee = wireFeeTable.in_ach;
            }

            if( _.isObject( wireFeeTable.in_percent ) ){
                _.forEach( wireFeeTable.in_percent, function( value, key ){
                    if( Ember.get( wire, 'amount' ) >= Number( key ) ){
                        wirePercentFee = Math.round( Ember.get( wire, 'amount' ) * value, 2 );
                    }
                } );
            }
            else{
                wirePercentFee = Math.round( Ember.get( wire, 'amount' ) * wireFeeTable.in_percent, 2 );
            }
        }
        if( Ember.get( wire, 'type' ) === 0 && wireFeeTable.hasOwnProperty( 'out_wire_max' ) ){
            return Math.min( Math.round( wireFee + wirePercentFee, 2 ), wireFeeTable.out_wire_max );
        }
        else if( Ember.get( wire, 'type' ) === 1 && wireFeeTable.hasOwnProperty( 'in_wire_max' ) ){
            return Math.min( Math.round( wireFee + wirePercentFee, 2 ), wireFeeTable.in_max );
        }
        else{
            return Math.round( wireFee + wirePercentFee, 2 );
        }

    }
} );
