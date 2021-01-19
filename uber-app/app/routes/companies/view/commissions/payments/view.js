import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){

        return Ember.RSVP.hash( {
            commission_payment_id: params.commission_payment_id,
            commission_payment_items: this.store.find( 'commission-payment-item', { commission_payment_id: params.commission_payment_id } ),
            company_id: this.modelFor( 'companies.view' ).get( 'id' )
        } );
    },

    setupController: function( controller, model ){
        controller.set( 'model', model.commission_payment_items );
        controller.set( 'commission_payment_id', model.commission_payment_id );
        controller.set( 'company_id', model.company_id );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/commissions/payments/view', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }

} );