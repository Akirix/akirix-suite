import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'uber-sar-submission', params.uber_sar_submission_id );
    },

    setupController: function( controller, model ){
        controller.set( 'uberSarSubmission', model );
    },

    renderTemplate: function( controller, model ){
        this.render('uber-sar-reports/view-submission', {
            into: 'uber-sar-reports',
            outlet: 'paneSecondary'
        } );
    }
} );