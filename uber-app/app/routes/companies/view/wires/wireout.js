import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'wire-template', { company_id: this.modelFor( 'companies.view' ).id } );
    },

    setupController: function( controller, model ){
        controller.set( 'wire', {
            account_id: null,
            beneficiary_type: null,
            bank_name: null,
            bank_address: null,
            bank_city: null,
            bank_state_province: null,
            bank_postal_code: null,
            bank_country: null,
            bank_phone: null,
            code_swift: null,
            code_aba: null,
            code_irc: null,
            account_holder: null,
            account_holder_dob: null,
            account_holder_nationality: null,
            account_holder_address: null,
            account_holder_city: null,
            account_holder_state_province: null,
            account_holder_postal_code: null,
            account_holder_country: null,
            account_number: null,
            account_iban: null,
            amount: null,
            notes: null,
            notes_akirix: null,
            speedwire: false,
            method: null,
            fee: null,
            type: 0,
            intermediary_bank_name: null,
            intermediary_bank_country: null,
            intermediary_bank_address: null,
            intermediary_bank_city: null,
            intermediary_bank_state_province: null,
            intermediary_bank_postal_code: null,
            intermediary_bank_code_swift: null,
            intermediary_bank_code_aba: null,
            purpose: null
        } );
        controller.set( 'templates', Ember.A() );
        controller.set( 'allTemplates', model );
        controller.set( 'template_id', null );
        controller.set( 'account', null );
        controller.store.find( 'account', { type: 0, company_id: this.modelFor( 'companies.view' ).id } ).then( function( accounts ){
            controller.set( 'accounts', accounts );
        } );
        controller.set( 'paneSecondary', 'companies/wires/wireout' );
    },

    renderTemplate: function( controller, model ){
        this.send( 'checkTwoFactorAuthenticated' );
        this.render( 'pane-secondary', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }

} );


