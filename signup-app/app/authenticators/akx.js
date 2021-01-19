import Ember from 'ember';
import OAuth2 from 'simple-auth-oauth2/authenticators/oauth2';
import config from 'signup-app/config/environment';

export default OAuth2.extend( {
    authenticate: function( credentials ){
        return new Ember.RSVP.Promise( function( resolve, reject ){
            Ember.$.ajax( {
                url: config.APP.signup_api_host + '/tokens',
                type: 'POST',
                data: credentials
            } ).then( function( response ){
                Ember.run( function(){
                    resolve( {
                        access_token: response.access_token,
                        user: response.user
                    } );
                } );
            }, function( xhr, status, error ){
                Ember.run( function(){
                    reject( xhr );
                } );
            } );
        } );
    }
} );