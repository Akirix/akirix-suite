import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {

    setupController: function( controller ){
        controller.store.find( 'uber-user' ).then( function( uberUsers ){
            controller.set( 'uberUsers', uberUsers );
        } ) ;
        controller.set( 'ticket', {
            title: null,
            company_id: this.modelFor( 'companies.view').get( 'id' ),
            priority: null,
            uber_user_id: null
        } );
        controller.set( 'documents', [] );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/tickets/add', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }
} );