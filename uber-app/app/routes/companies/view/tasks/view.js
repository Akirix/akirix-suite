import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import DirtyCheckRouteMixin from 'uber-app/mixins/dirty-check';

export default Ember.Route.extend( AuthenticatedRouteMixin, DirtyCheckRouteMixin, {
    templateName: '',

    model: function( params ){
        return this.store.find( 'uber-task', params.task_id );
    },

    setupController: function( controller, model ){
        controller.set( 'model', model );

        if( model.get( 'type' ) === 0 ){
            this.set( 'templateName', 'companies/tasks/view-task' );
        }
        else{
            this.set( 'templateName', 'companies/tasks/view-note' );
        }

        controller.store.find( 'uberDocument', { 'model': 'uber-task', 'model_id': model.id } ).then( function( documents ){
            controller.set( 'documents', documents );
        } );

        controller.store.find( 'uber-user' ).then( function( users ){
            controller.set( 'uberUsers', users );
        } );
    },

    renderTemplate: function( controller, model ){
        var templateName = this.get( 'templateName' );
        this.render( templateName, {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }
} );

