import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'currency' );
    },

    setupController: function( controller, model ){
        controller.set( 'currencies', model );
        controller.set( 'account', {
            name: null,
            currency_id: null
        } );
        controller.set( 'company_id', this.modelFor( 'companies.view' ).get( 'id' ) );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/accounts/add', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }

} );

