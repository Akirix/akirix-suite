import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import config from 'signup-app/config/environment';

export default Ember.Route.extend( {
    activate: function(){
        document.title = config.APP.company.name + " | Email Verification";
    },

    setupController: function( controller, model ){
        this._super( controller, model );

        var _this = this;
        var adapter = _this.get( 'akxAdapter' );

        var email = controller.get( 'email' );
        var token = controller.get( 'token' );

        this.render( 'loading', {
            into: 'application'
        } );

        if( !Ember.isEmpty( email ) && !Ember.isEmpty( token ) ){
            adapter.sendRequest( '/verifications/verify', 'post', { to: email, token: token } ).then( function(){
                controller.set( 'emailVerified', true );
                _this.render( 'email-verification', {
                    into: 'application'
                } );
            }, function(){
                controller.set( 'emailVerified', false );
                _this.render( 'email-verification', {
                    into: 'application'
                } );
            } );
        }

        var appController = this.controllerFor( 'application' );
        appController.set( 'showProcess', false );
    }
} );
