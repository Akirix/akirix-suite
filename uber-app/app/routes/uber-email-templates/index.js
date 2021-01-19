import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, {
    model: function( params ){
        return this.store.find( 'uber-email-template', params );
    },

    setupController: function( controller, model ){
        controller.set( 'uber-email-templates', model );
    },

    renderTemplate: function( controller, model ){
        this.render( { outlet: 'panePrimary' } );
        this.render( 'pane-secondary', {
            into: 'uber-email-templates',
            outlet: 'paneSecondary'
        } );
    }
} );