import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, {

    model: function( params ){
        return this.findPaged( 'access-log', params );
    },


    renderTemplate: function(){

        this.render( { outlet: 'panePrimary' } );
        this.render( 'pane-secondary', {
            into: 'access-logs',
            outlet: 'paneSecondary'
        } );
    }
} );
