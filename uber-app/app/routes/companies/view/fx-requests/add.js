import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function(){
        return this.store.find( 'currency', { type: 0 } );
    },

    setupController: function( controller, model ){
        controller.set( 'company_id', this.modelFor( 'companies.view' ).get( 'id' ) );
        controller.set( 'data', {
            base_amount: null,
            counter_amount: null,
            base_currency_id: null,
            counter_currency_id: null,
            from_account_id: null,
            notes: null,
            base_rate: null,
            customer_rate: null,
            cost_amount: null,
            fee_amount: null,
            fee_percentage: null,
            type: 0
        } );
        controller.set( 'fromAccount', null );
        controller.set( 'toAccount', null );
        controller.set( 'account', {
            name: null,
            currency_id: null,
            type: 0
        } );
        controller.store.find( 'account', { type: 0, company_id: this.modelFor( 'companies.view' ).id } ).then( function( accounts ){
            controller.set( 'accounts', accounts );
        } );
        controller.set( 'currencies', model );
    },

    renderTemplate: function(){
        this.send( 'checkTwoFactorAuthenticated' );
        this.render( 'companies/fx-requests/add', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }
} );