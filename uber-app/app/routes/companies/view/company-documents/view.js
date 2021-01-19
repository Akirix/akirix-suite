import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, {
    model: function( params ){
        return this.store.find( 'uber-document', params.uber_document_id );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/company-documents/view', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }
} );