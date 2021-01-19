import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';
import config from 'uber-app/config/environment';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, {
    model: function(){
        return this.store.find( 'wire', { type: 0, status: 1 } );
    },


    setupController: function( controller, model ){
        var today = new moment( new Date() );
        controller.set( 'incomingWires', controller.store.find( 'wire', { type: 1, updated_at: [ today.utc().format( 'YYYY-MM-DD' ),today.utc().format( 'YYYY-MM-DD' ) ], status: [ 1, 2 ] } ) );
        controller.set( 'pendingWires', model );
        controller.set( 'pendingBatches', controller.store.find( 'wire-batch', { status: [ 1, 2 ] } ) );
    },

    renderTemplate: function( controller, model ){
        this.render( 'dashboard/wire-summary', {
            into: 'dashboard',
            outlet: 'panePrimary'
        } );
    }
} );