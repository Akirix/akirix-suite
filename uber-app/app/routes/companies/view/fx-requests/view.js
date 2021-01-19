import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import DirtyCheckRouteMixin from 'uber-app/mixins/dirty-check';

export default Ember.Route.extend( AuthenticatedRouteMixin, DirtyCheckRouteMixin, {
    model: function( params ){
        return this.store.find( 'fx-request', params.fx_request_id ); //WIP (Probably needs more params
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/fx-requests/view', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }
} );