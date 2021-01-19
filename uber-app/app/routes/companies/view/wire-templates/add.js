import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {

    setupController: function( controller, model ){
        controller.set( 'wireTemplate', {
            notes: null,
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
            company_id: this.modelFor( 'companies.view' ).get( 'id' ),
            account_holder: null,
            account_number: null,
            account_iban: null,
            account_holder_dob: null,
            account_holder_nationality: null,
            account_holder_address: null,
            account_holder_city: null,
            account_holder_state_province: null,
            account_holder_postal_code: null,
            account_holder_country: null,
            intermediary_bank_code_swift: null,
            intermediary_bank_code_aba: null,
            intermediary_bank_name: null,
            intermediary_bank_address: null,
            intermediary_bank_city: null,
            intermediary_bank_state_province: null,
            intermediary_bank_postal_code: null,
            intermediary_bank_country: null,
            purpose: null
        } );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/wire-templates/add', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }
} );


