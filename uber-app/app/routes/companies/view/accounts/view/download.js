import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, {
    model: function( params ){

    },

    setupController: function( controller, model ){
        controller.set( 'account_id', this.modelFor( 'companies.view.accounts.view' ).get( 'id' ) );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/accounts/download', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }
} );


