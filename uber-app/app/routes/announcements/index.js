import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, {
    model: function( params ){
        return this.store.find( 'announcement', params );
    },
    renderTemplate: function( controller, model ){
        this.render( { outlet: 'panePrimary' } );
        this.render( 'pane-secondary', {
            into: 'announcements',
            outlet: 'paneSecondary'
        } );
    }
} );