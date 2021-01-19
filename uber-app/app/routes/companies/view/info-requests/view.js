import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'info-request', params.info_request_id );
    },

    setupController: function( controller, model ){
        controller.set( 'company', [ {
            company_id: this.modelFor( 'companies.view' ).get( 'id' ),
            companyName: this.modelFor( 'companies.view' ).get( 'name' )
        } ] );
        controller.set( 'info-req', model );
    },

    renderTemplate: function(){
        this.render( 'companies/info-requests/view-info-req', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }
} );


