import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import DirtyCheckRouteMixin from 'uber-app/mixins/dirty-check';

export default Ember.Route.extend( AuthenticatedRouteMixin, DirtyCheckRouteMixin, {
    model: function( params ){
        return this.store.find( 'fx-request', params.fx_request_id );
    },


    renderTemplate: function( controller, model ){
        this.render( 'fx-requests/view', {
            into: 'fx-requests',
            outlet: 'paneSecondary'
        } );
    }

} );