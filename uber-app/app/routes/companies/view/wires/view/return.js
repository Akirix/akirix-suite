import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'wire', this.modelFor( 'companies.view.wires.view' ).id );
    },

    setupController: function( controller, model ){
        controller.set( 'wire', {
            account_id: model.get( 'account_id' ),
            bank_name: '',
            bank_address: null,
            bank_city: null,
            bank_state_province: null,
            bank_postal_code: null,
            bank_country: 'US',
            bank_phone: null,
            code_swift: null,
            code_aba: null,
            code_irc: null,
            account_holder: 'Akirix Returned Wires',
            account_number: null,
            account_iban: null,
            amount: null,
            notes: 'Return of W-' + model.get( 'name' ),
            notes_akirix: null,
            speedwire: false,
            method: null,
            fee: null,
            parent_id: model.get( 'id' )
        } );
        controller.set( 'account', null );
        controller.store.find( 'account', { type: 0, company_id: model.get( 'company_id' ), currency_id: model.get( 'currency_id' ) } ).then( function( accounts ){
            controller.set( 'accounts', accounts );
        } );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/wires/return', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }

} );


