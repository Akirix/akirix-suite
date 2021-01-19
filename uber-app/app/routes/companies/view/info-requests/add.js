import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {

    setupController: function( controller ){

        controller.set( 'infoRequest', {
            type: null,
            model: null,
            model_id: null,
            notes: null,
            deadLine: null
        } );
        controller.set( 'company', [ {
            company_id: this.modelFor( 'companies.view' ).get( 'id' ),
            companyName: this.modelFor( 'companies.view' ).get( 'name' )
        } ] );
    },

    renderTemplate: function(){
        this.render( 'companies/info-requests/add', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }
} );