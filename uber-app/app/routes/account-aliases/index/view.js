import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'account-alias', params.account_alias_id );
    },

    renderTemplate: function( controller, model ){
        this.render( 'account-aliases/view', {
            into: 'account-aliases',
            outlet: 'paneSecondary'
        } );
    },

    setupController: function( controller, model ){
        controller.set( 'model', model );
    }
} );