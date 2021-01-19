import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function(){
        return this.store.find( 'account', { company_id: this.modelFor( 'companies.view' ).get( 'id' ) } );
    },

    setupController: function( controller, model ){
        controller.set( 'model', {
            account_id: null,
            company_id: this.modelFor( 'companies.view' ).get( 'id' ),
            amount: null,
            currency_id: null,
            type: null,
            start_date: null,
            title: null,
            notes: null,
            frequency: null,
            frequency_type: null
        } );
        controller.set( 'accounts', model );
        controller.set( 'types', [ { text: 'One Time Charge', val: 0 }, { text: 'Recurring Charge', val: 1 } ] );
        controller.set( 'frequencyTypes', [ { text: 'Day', val: 'day' }, { text: 'Week', val: 'week' }, { text: 'Month', val: 'month' }, { text: 'Year', val: 'year' } ] );
    },

    renderTemplate: function(){
        this.render( 'companies/charges/add', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }
} );