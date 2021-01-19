import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'uber-user' );
    },

    setupController: function( controller, model ){
        controller.set( 'uberUsers', model );
        controller.set( 'company_id', this.modelFor( 'companies.view' ).get( 'id' ) );
        controller.set( 'documents', [] );
        controller.set( 'task', {
            type: 1,
            priority: 1,
            sentiment: 1,
            due_date: null,
            uber_user_id: null,
            title: null,
            notes: null,
            notes_new: null
        } );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/tasks/add', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }

} );

