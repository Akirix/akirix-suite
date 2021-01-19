import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return { name: null, type: null };
    },

    setupController: function( controller, model ){
        controller.set( 'authenticator', model );
    },

    renderTemplate: function( controller, model ){
        this.send( 'checkTwoFactorAuthenticated' );

        this.render( 'authenticators/add', {
            into: 'authenticators',
            outlet: 'paneSecondary'
        } );
    }
} );

