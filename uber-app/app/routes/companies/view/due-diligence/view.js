import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'uber-due-diligence', params.uber_due_diligence_id );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/due-diligence/view', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }

} );
