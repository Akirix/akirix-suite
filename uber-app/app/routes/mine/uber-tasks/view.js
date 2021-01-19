import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import DirtyCheckRouteMixin from 'uber-app/mixins/dirty-check';

export default Ember.Route.extend( AuthenticatedRouteMixin, DirtyCheckRouteMixin, {
    model: function( params ){
        return this.store.find( 'uber-task', params.task_id );
    },

    setupController: function( controller, model ){
        controller.set( 'model', model );
        controller.store.find( 'uber-user' ).then( function( uberUsers ){
            controller.set( 'uberUsers', uberUsers );
        } );
        controller.store.find( 'uberDocument', { 'model': 'uber-task', 'model_id': model.id } ).then( function( documents ){
            controller.set( 'documents', documents );
        } );
    },

    renderTemplate: function(){
        this.render( 'mine/view-uber-task', {
            into: 'mine',
            outlet: 'paneSecondary'
        } );
    }

} );
