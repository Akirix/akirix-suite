import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, {
    model: function( params ){
        return this.store.find( 'ticket', { company_id: this.modelFor( 'companies.view').get( 'id' ) } );
    },
    renderTemplate: function( controller, model ){
        this.render( 'companies/tickets', {
            into: 'companies/view',
            outlet: 'companyPrimary'
        } );

        this.render( 'companies/nav-tickets', {
            into: 'companies/view',
            outlet: 'companyNavbar'
        } );
    },
    activate: function(){
        document.title = this.modelFor( 'companies.view' ).get( 'name' ) + ' | Support Tickets';
    },
    actions: {

    }
} );