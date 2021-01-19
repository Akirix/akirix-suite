import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import DirtyCheckRouteMixin from 'uber-app/mixins/dirty-check';

export default Ember.Route.extend( AuthenticatedRouteMixin, DirtyCheckRouteMixin, {
    model: function( params ){
        return this.store.find( 'account-alias-rule', params.account_alias_rule_id );
    },

    setupController: function( controller, model ){
        controller.set( 'model', model );
    },

    renderTemplate: function( controller, model ){
        this.render( 'account-alias-rules/view', {
            into: 'account-alias-rules',
            outlet: 'paneSecondary'
        } );
    }
} );

