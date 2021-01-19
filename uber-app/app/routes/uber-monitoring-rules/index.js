import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, {
    queryParams: {
        status: { refreshModel: true }
    },

    model: function( params ){
        return this.findPaged( 'uber-mon-rule', params );
    },
    renderTemplate: function(){
        this.render( { outlet: 'panePrimary' } );
    }

} );