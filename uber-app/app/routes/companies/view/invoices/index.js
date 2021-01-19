import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, {
    model: function( params ){
        var controller = this.controllerFor( 'companies.view.invoices.index' );
        return this.findPaged( 'invoice', { company_id: this.modelFor( 'companies.view.invoices' ).get( 'id' ) } );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/invoices/index', {
            into: 'companies/view',
            outlet: 'companyPrimary'
        } );

        this.render( 'companies/nav-invoices', {
            into: 'companies/view',
            outlet: 'companyNavbar'
        } );
    },
    activate: function(){
        document.title = this.modelFor( 'companies.view' ).get( 'name' ) + ' | Invoices';
    }

} );
