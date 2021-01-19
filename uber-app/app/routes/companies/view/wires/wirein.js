import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'wire-template', { company_id: this.modelFor( 'companies.view' ).id } );
    },

    setupController: function( controller, model ){
        controller.set( 'wire', {
            account_id: null,
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
            account_number: null,
            account_iban: null,
            amount: null,
            notes: null,
            notes_akirix: null,
            speedwire: false,
            method: 0,
            fee: null,
            type: 1
        } );
        controller.set( 'templates', model );
        controller.set( 'template_id', null );
        controller.set( 'account', null );
        controller.set( 'paneSecondary', 'companies/wires/wirein' );
        controller.store.find( 'account', { type: 0, company_id: this.modelFor( 'companies.view' ).id } ).then( function( accounts ){
            controller.set( 'accounts', accounts );
        } );
    },

    renderTemplate: function( controller, model ){
        this.send( 'checkTwoFactorAuthenticated' );
        this.render( 'pane-secondary', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }

} );


