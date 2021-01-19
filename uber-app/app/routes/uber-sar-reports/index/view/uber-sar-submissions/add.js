import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {


    setupController: function( controller, params ){
        controller.set( 'uberSarSubmission', {
            type: null,
            reference: null,
            status: null,
            confirmation: null,

        } );

        controller.set('uber_sar_report_id', this.modelFor( 'uber-sar-reports.index.view' ).get( 'id' ));
    },

    renderTemplate: function( controller, model ){
        this.render( 'uber-sar-reports/add-submission', {
            into: 'uber-sar-reports',
            outlet: 'paneSecondary'
        } );
    }
} );