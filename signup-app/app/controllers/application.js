import Ember from 'ember';
import LoginControllerMixin from 'simple-auth/mixins/login-controller-mixin';
import config from 'signup-app/config/environment';

export default Ember.Controller.extend( {
    showProcess: Ember.computed.alias( 'session.isAuthenticated' ),

    platformUrl: function(){
        return config.APP.app_host;
    }.property(),

    actions: {
        goBackToStep: function( step ){
            var _this = this;
            var registration = this.get( 'model' );
            var adapter = _this.get( 'akxAdapter' );

            if( registration.get( 'status' ) === 0 ){
                registration.revokeStep( step );
                adapter.sendRequest( '/registrations/' + registration._id + '/appSteps', 'put', { appSteps: registration.appSteps } )
                    .then( function( result ){
                        _this.transitionToRoute( registration.get( 'nextStep' ) );
                    } )
                    .catch( function(){
                        _this.notify.alert( { raw: config.messages.update_error, closeAfter: null } );
                    } );
            }
        }
    }
} );
