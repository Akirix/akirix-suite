import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';
import config from 'uber-app/config/environment';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, {
    model: function(){
        return this.store.find( 'wire', { type: 1, status: [ 4, 6 ] } );
    },

    setupController: function( controller, model ){
        controller.set( 'wires', model );
        controller.set( 'availableAccounts', [] );
    },

    renderTemplate: function( controller, model ){
        this.render( 'dashboard/hold-in', {
            into: 'dashboard',
            outlet: 'panePrimary'
        } );
    }
} );
