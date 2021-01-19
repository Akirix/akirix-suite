import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'charge', params.charge_id );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/charges/view', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    },

    setupController: function( controller, model ){
        controller.set( 'model', model );
    }
} );