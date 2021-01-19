import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        var company_id = this.modelFor( 'companies.view' ).id;

        return Ember.RSVP.hash( {
            accounts: this.store.find( 'account', { type: 0, company_id: company_id } ),
            wireInstructions: this.store.find( 'wire-instruction', { preferred: false } ),
            company_id: company_id
        } );
    },

    setupController: function( controller, model ){
        controller.set( 'accountAlias', {
            name: null,
            iban: null,
            account_id: null,
            wire_instruction_id: null,
            notes: null
        } );

        controller.set( 'accounts', model.accounts );
        controller.set( 'wireInstructions', model.wireInstructions );
        controller.set( 'company_id', model.company_id );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/account-aliases/add', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }

} );

