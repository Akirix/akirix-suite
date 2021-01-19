import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, {

    model: function( params ){
        return this.store.find( 'charge', { company_id: this.modelFor( 'companies.view' ).get( 'id' ) } );
    },

    setupController: function( controller, model ){
        controller.set( 'model', model );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/charges', {
            into: 'companies/view',
            outlet: 'companyPrimary'
        } );

        this.render( 'companies/nav-charges', {
            into: 'companies/view',
            outlet: 'companyNavbar'
        } );
    },

    activate: function(){
        document.title = this.modelFor( 'companies.view' ).get( 'name' ) + ' | Charges';
    }

} );