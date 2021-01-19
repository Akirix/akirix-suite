import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, {

    model: function ( params ) {
        return this.findPaged( 'company-relationship', {
            institution_id: this.modelFor( 'companies.view' ).get( 'id' ),
            status: 1
        } );
    },


    renderTemplate: function ( controller, model ) {
        this.render( 'companies/company-relationships', {
            into: 'companies/view',
            outlet: 'companyPrimary'
        } );

        this.render( 'companies/company-relationships/help-index', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );

        this.render( 'companies/nav-company-relationships', {
            into: 'companies/view',
            outlet: 'companyNavbar'
        } );

    },

    activate: function () {
        document.title = this.modelFor( 'companies.view' ).get( 'name' ) + ' | Company Relationships';
    },


} );
