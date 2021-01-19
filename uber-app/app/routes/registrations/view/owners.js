import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {

    setupController: function( controller, model ){
        var registration = this.modelFor( 'registrations/view' );
        controller.set( 'uboCount', registration.get( 'owners.length' ) );
    },

    renderTemplate: function( controller, model ){
        this.render( 'registrations.owners', {
            into: 'registrations.view',
            outlet: 'registrationPrimary'
        } );
    }
} );
