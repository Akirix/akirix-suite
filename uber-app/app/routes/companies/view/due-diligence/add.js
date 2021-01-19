import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {


    setupController: function( controller, model ){
        controller.set( 'company_id', this.modelFor( 'companies.view' ).get( 'id' ) );
        controller.set( 'options', {
            trading_relationship: false,
            wire_history: false,
            notes: false,
            statements: false,
            registration_docs: false,
            sar_reports: false
        } );
    },
    renderTemplate: function( controller, model ){
        this.render( 'companies/due-diligence/add', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }

} );

