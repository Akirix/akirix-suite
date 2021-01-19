import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, {
    model: function( params ){
        return this.findPaged( 'wire-batch', params );
    },

    renderTemplate: function( controller, model ){
        this.render( { outlet: 'panePrimary' } );
    }
} );