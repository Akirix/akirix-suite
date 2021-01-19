import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function(){
        return this.store.find( 'wire-instruction', { preferred: false } );
    },

    setupController: function( controller, model ){
        controller.set( 'company_id', this.modelFor( 'companies.view' ).get( 'id' ) );
        controller.set( 'model', model );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/wire-instructions/add', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }
} );


