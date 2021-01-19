import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {

    model: function( params ){

        return Ember.RSVP.hash( {
            commission_id: params.commission_id,
            commission_payment_items: this.store.find( 'commission-payment-item', params )
        } );
    },

    setupController: function( controller, model ){
        controller.set( 'model', model.commission_payment_items );
        controller.set( 'commission_id', model.commission_id );
    },


    renderTemplate: function( controller, model ){
        this.render( 'affiliates/commissions/view', {
            into: 'affiliates',
            outlet: 'paneSecondary'
        } );
    }

} );