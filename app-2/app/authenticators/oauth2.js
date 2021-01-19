import Ember from 'ember';
import config from 'akx-app/config/environment';
import OAuth2PasswordGrant from 'ember-simple-auth/authenticators/oauth2-password-grant';

export default OAuth2PasswordGrant.extend( {
    authenticate: function( data, scope ){
        return new Ember.RSVP.Promise( function( resolve, reject ){
            var scopesString = Ember.makeArray( scope ).join( ' ' );
            if( !Ember.isEmpty( scopesString ) ){
                data.scope = scopesString;
            }
            Ember.$.ajax( {
                url: config.APP.api_host + '/tokens',
                type: 'POST',
                data: data
            } ).then( function( response ){
                Ember.run( function(){
                    resolve( {
                        access_token: response.access_token,
                        user: response.user,
                        company: response.company,
                        access: response.access
                    } );
                } );
            }, function( xhr ){
                Ember.run( function(){
                    reject( xhr );
                } );
            } );

        } );
    }
} );
