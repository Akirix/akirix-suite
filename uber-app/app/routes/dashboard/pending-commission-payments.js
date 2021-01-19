import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';
import config from 'uber-app/config/environment';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, {
    model: function( params ){
        return this.store.find( 'commission-payment', { status: 0 } );
    },

    setupController: function( controller, model ){
        controller.set( 'model', model );
    },

    renderTemplate: function(){
        this.render( 'dashboard/pending-commission-payments', {
            into: 'dashboard',
            outlet: 'panePrimary'
        } );
    }
} );