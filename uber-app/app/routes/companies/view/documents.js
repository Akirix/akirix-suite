import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, {
    model: function( params ){

    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/nav-documents', {
            into: 'companies/view',
            outlet: 'companyNavbar'
        } );

        this.transitionTo( 'companies.view.documents.uber-documents' );
    },

    activate: function(){
        document.title = this.modelFor( 'companies.view' ).get( 'name' ) + ' | Documents';
    }
} );