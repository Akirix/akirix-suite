import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.modelFor( 'companies.view.accounts.view' );
    },

    setupController: function( controller, model ){
        controller.set( 'model', model );
        controller.set( 'statements', this.store.find( 'statement', { account_id: model.id } ) );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/accounts/view', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }
} );
