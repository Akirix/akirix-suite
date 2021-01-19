import Ember from 'ember';
import config from 'signup-app/config/environment';

export default Ember.Route.extend( {
    activate: function(){
        document.title = config.APP.company.name + " | Login";
    },

    setupController: function( controller ){
        this._super( ...arguments );
        if( this.get( 'session.isAuthenticated' ) ){
            this.get( 'session' ).invalidate();
        }
        else{
            var token = controller.get( 'token' );
            if( !Ember.isEmpty( token ) ){
                controller.send( 'login', { token: token } );
            }
            else{
                controller.set( 'email', null );
                controller.set( 'password', null );
            }
        }
    }
} );
