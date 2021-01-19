import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){

    },

    setupController: function( controller, model ){
        controller.set('company_id', this.modelFor( 'companies.view').get( 'id' ));
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/wires/download', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }
} );


