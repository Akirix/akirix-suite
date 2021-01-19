import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import DirtyCheckRouteMixin from 'uber-app/mixins/dirty-check';

export default Ember.Route.extend( AuthenticatedRouteMixin, DirtyCheckRouteMixin, {
    model: function( params ){
        return this.store.find( 'commission', params.commission_id );
    },


    setupController: function( controller, model ){
        controller.set( 'model', model );
        controller.set( 'paymentItems', this.store.find( 'commission-payment-item', { commission_id: model.id } ) );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/commissions/view', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );

    }


} );

