import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';
import config from 'uber-app/config/environment';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, {
    model: function( params ){
        return this.store.find( 'fx-request', { status: [ 0, 1 ] } );
    },

    setupController: function( controller, model ){
        controller.set( 'model', model );
        controller.set( 'startedRequests', controller.store.find( 'fx-request', { status: 1 } ) );
    },

    renderTemplate: function(){
        this.render( 'dashboard/fx-requests', {
            into: 'dashboard',
            outlet: 'panePrimary'
        } );
    }
} );