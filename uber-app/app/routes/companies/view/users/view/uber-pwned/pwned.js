import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import DirtyCheckRouteMixin from 'uber-app/mixins/dirty-check';

export default Ember.Route.extend( AuthenticatedRouteMixin, DirtyCheckRouteMixin, {
    model: function( params ){
        return this.store.find( 'uber-pwned', params.uber_pwned_id );
    },

    setupController: function( controller, model ){
        controller.set( 'model', model );
        controller.set( 'data', {
            title: null,
            name: null
        } );

    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/users/pwned', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }
} );

