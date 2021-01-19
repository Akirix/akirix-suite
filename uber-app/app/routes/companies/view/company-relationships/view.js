import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'company-relationship', params.company_relationship_id );
    },

    setupController: function( controller, model ){
        controller.set( 'model', model );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/company-relationships/view', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }
} );
