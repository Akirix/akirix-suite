import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import DirtyCheckRouteMixin from 'uber-app/mixins/dirty-check';

export default Ember.Route.extend( AuthenticatedRouteMixin, DirtyCheckRouteMixin, {
    model: function( params ){
        return this.store.find( 'wire', params.wire_id );
    },

    setupController: function( controller, model ){
        controller.set( 'wire', model );

        controller.set( 'account', null );
        controller.set( 'availableAccounts', null );
        controller.set( 'found', null );
    },

    renderTemplate: function( controller, model ){
        this.render( 'dashboard/ach-recall/view', {
            into: 'dashboard',
            outlet: 'paneSecondary'
        } );
    }
} );