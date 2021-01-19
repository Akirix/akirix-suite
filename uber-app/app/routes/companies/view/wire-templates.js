import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'wire-template', { company_id: this.modelFor( 'companies.view' ).get( 'id' ) } );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/wire-templates', {
            into: 'companies/view',
            outlet: 'companyPrimary'
        } );

        this.render( 'companies/nav-wire-templates', {
            into: 'companies/view',
            outlet: 'companyNavbar'
        } );
    },
    activate: function(){
        document.title = this.modelFor( 'companies.view' ).get( 'name' ) + ' | Wires Templates';
    },

    actions: {}
} );
