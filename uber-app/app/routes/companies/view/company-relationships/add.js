import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {


    setupController: function ( controller, model ) {
        controller.set( 'company_id', null );
        controller.set( 'institution_id', this.modelFor( 'companies.view' ).get( 'id' ) );
    },

    renderTemplate: function ( controller, model ) {
        this.render( 'companies/company-relationships/add', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }

} );

