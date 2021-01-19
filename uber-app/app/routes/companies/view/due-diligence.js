import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        params.company_id = this.modelFor( 'companies.view' ).get( 'id' );
        return this.store.find( 'uber-due-diligence', params );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/due-diligence', {
            into: 'companies/view',
            outlet: 'companyPrimary'
        } );

        this.render( 'companies/nav-due-diligence', {
            into: 'companies/view',
            outlet: 'companyNavbar'
        } );
    },

    activate: function(){
        document.title = this.modelFor( 'companies.view' ).get( 'name' ) + ' | Due Diligence';
    }


} );
