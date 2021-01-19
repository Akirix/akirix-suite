import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    setupController: function( controller ){
        controller.set( 'announcement', {
            name: null,
            notes: null,
            publish_from: null,
            publish_to: null
        } );
    },

    renderTemplate: function( controller ){
        this.render( 'announcements/add', {
            into: 'announcements',
            outlet: 'paneSecondary'
        } );
    }

} );