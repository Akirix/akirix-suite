import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, {
    model: function(){
        return this.store.find( 'wire', { type: 0, status: [ 4, 6 ] } );
    },

    setupController: function( controller, model ){
        controller.set( 'wires', model );
    },

    renderTemplate: function( controller, model ){
        this.render( 'dashboard/hold-out', {
            into: 'dashboard',
            outlet: 'panePrimary'
        } );
    }
} );