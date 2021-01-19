import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'commission-payment', params.commission_payment_id );
    },

    setupController: function( controller, model ){
        controller.set( 'payment', this.store.find( 'commission-payment-item', { commission_payment_id: model.id } ) );
        controller.set( 'cp', model );
        controller.set( 'accountsAvailable', this.store.find( 'account', { company_id: model.get( 'affiliate.id' ), currency_id: model.get( 'currency.id' ) } ) );
    },

    renderTemplate: function( controller, model ){
        this.render( 'dashboard/pending-commission-payments/view', {
            into: 'dashboard',
            outlet: 'paneSecondary'
        } );
    }

} );