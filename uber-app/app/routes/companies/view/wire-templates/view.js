import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'wire-template', params.wire_template_id );
    },

    setupController: function( controller, model ){
        controller.set( 'wireTemplate', model );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/wire-templates/view', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }
} );

