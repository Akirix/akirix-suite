import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function(){
        return this.store.find( 'account', { type: 0, company_id: this.modelFor( 'companies.view' ).id } );
    },

    setupController: function( controller, model ){
        controller.set( 'data', {
            account_id: null,
            to_account_id: null,
            amount: null
        } );

        controller.set( 'account', null );
        controller.set( 'toAccount', null );
        controller.set( 'accounts', model );
    },

    renderTemplate: function( controller, model ){
        this.send( 'checkTwoFactorAuthenticated' );
        this.render( 'companies/wires/internal-account', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }
} );