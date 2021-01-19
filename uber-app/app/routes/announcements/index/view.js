import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import DirtyCheckRouteMixin from 'uber-app/mixins/dirty-check';

export default Ember.Route.extend( AuthenticatedRouteMixin, DirtyCheckRouteMixin, {
    model: function( params ){
        return this.store.find( 'announcement', params.announcement_id );
    },

    renderTemplate: function( controller, model ){
        this.render( 'announcements/view', {
            into: 'announcements',
            outlet: 'paneSecondary'
        } );
    }
} );
