import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'account', this.modelFor( 'companies.view.accounts.view' ).get( 'id' ) );
    },

    setupController: function( controller, model ){
        controller.set( 'model', model );
        controller.set( 'data', {
            amount: null,
            notes: null
        } );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/accounts/fee-refund', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    },
} );


