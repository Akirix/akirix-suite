import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, {
    model: function( params ){
        return null;
    },

    setupController: function( controller, model ){

    },

    renderTemplate: function(){
        this.render( 'uber-tasks/index', {
            into: 'uber-tasks',
            outlet: 'panePrimary'
        } );
    },

    actions: {
        refreshTasks: function(){
            var self = this;
            var controller = self.controllerFor( 'uber-tasks.index' );
            var query = { page: controller.get( 'page' ), per_page: controller.get( 'perPage' ) };
            if( controller.get( 'status' ) ){
                query[ 'status' ] = controller.get( 'status' );
            }
            if( controller.get( 'type' ) ){
                query[ 'type' ] = controller.get( 'type' );
            }
            if( controller.get( 'due_date' ) ){
                query[ 'due_date' ] = moment( new Date() ).format( 'YYYY-MM-DD' );
            }
            this.findPaged( 'uber-task', query ).then( function( tasks ){
                controller.set( 'model', tasks );
            } );
        }
    }
} );