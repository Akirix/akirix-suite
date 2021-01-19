import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import DirtyCheckRouteMixin from 'uber-app/mixins/dirty-check';

export default Ember.Route.extend( AuthenticatedRouteMixin, DirtyCheckRouteMixin, {
    model: function( params ){
        return this.store.find( 'ticket', params.ticket_id );
    },

    setupController: function( controller, model ){
        controller.set( 'ticket', model );
        controller.store.find( 'uber-user' ).then( function( uberUsers ){
            controller.set( 'uberUsers', uberUsers );
        } );
        controller.store.find( 'uber-tag', { model: 'Ticket', model_id: model.id } ).then( function( tags ){
            controller.set( 'tags', tags );
        } );
        controller.set( 'data', {
            ticket_id: null,
            notes: null
        } );
        controller.set( 'documents', [] );
    },

    renderTemplate: function(){
        this.render( 'tickets/view', {
            into: 'tickets',
            outlet: 'paneSecondary'
        } );
    }

} );
