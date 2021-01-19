import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'fx-request', params.fx_request_id );
    },

    setupController: function( controller, model ){
        controller.store.find( 'account', { company_id: model.get( 'company_id' ), currency_id: model.get( 'counter_currency_id' ), type: 0 } )
            .then( function( accounts ){
                controller.set( 'accountsAvailable', accounts );
            } );
        controller.set( 'model', model );
        controller.set( 'debitedAmount', null );
        controller.set( 'creditedAmount', null );
    },

    renderTemplate: function( controller, model ){
        this.render( 'dashboard/fx-requests/view', {
            into: 'dashboard',
            outlet: 'paneSecondary'
        } );
    }
} );