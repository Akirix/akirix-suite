import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';
import config from 'uber-app/config/environment';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, {
    model: function(){
        return this.store.find( 'wire', { type: 0, status: 9 } );
    },

    renderTemplate: function( controller, model ){
        this.render( 'dashboard/queue', {
            into: 'dashboard',
            outlet: 'panePrimary'
        } );
    }
} );