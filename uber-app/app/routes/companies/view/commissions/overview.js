import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function(){
        return this.store.find( 'commission-payment-item', {
            affiliate_id: this.modelFor( 'companies.view' ).get( 'id' ),
            commission_payment_id: 'null'
        } );
    },
    renderTemplate: function( controller, model ){
        this.render( 'companies/commissions/overview', {
            into: 'companies/view',
            outlet: 'companyPrimary'
        } );
        this.render( 'companies/commissions/overview-summary', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }
} );