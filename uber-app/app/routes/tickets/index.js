import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, {
    model: function( params ){
        return null;
    },

    renderTemplate: function(){
        this.render( 'tickets/index', {
            into: 'tickets',
            outlet: 'panePrimary'
        } );
    },

    actions: {
        refreshTicket: function(){
            var self = this;
            var controller = self.controllerFor( 'tickets.index' );
            var query = { status: controller.get( 'status' ), page: controller.get( 'page' ), per_page: controller.get( 'perPage' ) };
            this.findPaged( 'ticket', query ).then( function( tickets ){
                controller.set( 'model', tickets );
            } );
        }
    }
} );
