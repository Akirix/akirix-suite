import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import DirtyCheckRouteMixin from 'uber-app/mixins/dirty-check';

export default Ember.Route.extend( AuthenticatedRouteMixin, DirtyCheckRouteMixin, {
    model: function( params ){
        return this.store.find( 'uber-email-template', params.uber_email_template_id );
    },

    renderTemplate: function( controller, model ){
        this.render( 'uber-email-templates/view', {
            into: 'uber-email-templates',
            outlet: 'paneSecondary'
        } );
    }
} );
