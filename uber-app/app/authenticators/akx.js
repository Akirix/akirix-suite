import Ember from 'ember';
import OAuth2 from 'simple-auth-oauth2/authenticators/oauth2';
import config from 'uber-app/config/environment';

export default OAuth2.extend( {
    authenticate: function( credentials ){
        return new Ember.RSVP.Promise( function( resolve, reject ){
            Ember.$.ajax( {
                url: config.APP.uber_api_host + '/uberTokens',
                type: 'POST',
                data: credentials
            } ).then( function( response ){
                Ember.run( function(){
                    resolve( {
                        access_token: response.access_token,
                        user_data: JSON.stringify( response.user ),
                        company_data: JSON.stringify( response.company ),
                        access_list: JSON.stringify( response.access )
                    } );
                } );
            }, function( xhr, status, error ){
                Ember.run( function(){
                    reject( xhr );
                } );
            } );
        } );
    },
} );