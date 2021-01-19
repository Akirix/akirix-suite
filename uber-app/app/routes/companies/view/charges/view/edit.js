import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function(){
        return this.store.find( 'charge', this.modelFor( 'companies.view.charges.view' ).get( 'id' ) );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/charges/edit', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    },

    setupController: function( controller, model ){
        var self = this;
        controller.set( 'model', model );
        controller.set( 'theCurrentAcc', this.store.find( 'account', model.get( 'account_id' ) ) );
        controller.set( 'str_freq_types_add', [ { text: 'Day', val: 0 }, { text: 'Week', val: 1 }, { text: 'Month', val: 2 }, { text: 'Year', val: 3 } ] );
        controller.set( 'available_accounts', this.store.find( 'account', { company_id: self.modelFor( 'companies.view' ).get( 'id' ) } ) );
    }

} );