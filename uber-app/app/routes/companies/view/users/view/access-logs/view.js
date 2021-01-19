import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import DirtyCheckRouteMixin from 'uber-app/mixins/dirty-check';

export default Ember.Route.extend( AuthenticatedRouteMixin, DirtyCheckRouteMixin, {
    model: function( params ){
        return this.store.find( 'access-log', params.access_log_id );
    },

    setupController: function( controller, model ){
        controller.set( 'model', model );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/users/access', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }
} );


