import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';


export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, {
    model: function( params ){
        return this.store.find( 'commission-payment', { affiliate_id: this.modelFor( 'companies.view' ).get( 'id' ) } );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/commissions/payments', {
            into: 'companies/view',
            outlet: 'companyPrimary'
        } );
    }
} );