import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, {
    model: function(){
        return this.store.find( 'wire', { type: 0, status: 7 } );
    },

    setupController: function( controller, model ){
        controller.set( 'wires', model );
    },

    renderTemplate: function( controller, model ){
        this.render( 'dashboard/ach-recall', {
            into: 'dashboard',
            outlet: 'panePrimary'
        } );
    }
} );