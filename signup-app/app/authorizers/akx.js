import Ember from 'ember';
import Base from 'simple-auth/authorizers/base';

export default Base.extend( {
    authorize: function( jqXHR, requestOptions ){
        var accessToken = this.get( 'session.access_token' );
        if( this.get( 'session.isAuthenticated' ) && !Ember.isEmpty( accessToken ) ){
            jqXHR.setRequestHeader( 'Authorization', 'Bearer ' + accessToken );
        }
    }
} );