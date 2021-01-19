import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {

    setupController: function( controller, model ){
        controller.set( 'affiliate', this.modelFor( 'companies.view' ) );
        controller.set( 'commission', {
            start_date: null,
            end_date: null,
            rate: null,
            account_number: null,
            company_id: null,
            affiliate_id: this.modelFor( 'companies.view' ).id
        } );
    },

    renderTemplate: function( controller, model ){
        this.send( 'checkTwoFactorAuthenticated' );
        this.render( 'companies/commissions/add', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }

} )
;