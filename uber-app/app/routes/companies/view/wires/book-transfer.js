import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    setupController: function( controller, model ){
        controller.set( 'wire', {
            account_number: null,
            company: null,
            account_id: null,
            notes: null,
            fee: null
        } );

        controller.set( 'account', null );
        controller.store.find( 'account', { type: 0, company_id: this.modelFor( 'companies.view' ).id } ).then( function( accounts ){
            controller.set( 'accounts', accounts );
        } );
    },

    renderTemplate: function( controller, model ){
        this.send( 'checkTwoFactorAuthenticated' );
        this.render( 'companies/wires/book-transfer', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }

} );
