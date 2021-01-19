import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, {

    model: function( params ){
        return this.findPaged( 'account-alias', { company_id: this.modelFor( 'companies.view' ).get( 'id' ) } );
    },

    setupController: function( controller, model ){
        controller.set( 'company_id', this.modelFor( 'companies.view' ).get( 'id' ) );
        controller.set( 'model', model );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/preferred-accounts', {
            into: 'companies/view',
            outlet: 'companyPrimary'
        } );

        this.render( 'companies/nav-company', {
            into: 'companies/view',
            outlet: 'companyNavbar'
        } );
    },

    activate: function(){
        document.title = this.modelFor( 'companies.view' ).get( 'name' ) + ' | Preferred Accounts';
    },


} );
