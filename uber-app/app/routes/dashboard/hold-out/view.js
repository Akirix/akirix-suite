import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import DirtyCheckRouteMixin from 'uber-app/mixins/dirty-check';

export default Ember.Route.extend( AuthenticatedRouteMixin, DirtyCheckRouteMixin, {
    model: function( params ){
        return this.store.find( 'wire', params.wire_id );
    },

    setupController: function( controller, model ){
        controller.set( 'wire', model );
    },

    renderTemplate: function( controller, model ){
        this.render( 'dashboard/hold-out/view', {
            into: 'dashboard',
            outlet: 'paneSecondary'
        } );
    }
} );