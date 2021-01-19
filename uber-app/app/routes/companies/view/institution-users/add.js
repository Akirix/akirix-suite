import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    setupController: function( controller, model ){
        controller.set( 'userList', controller.store.find( 'user', { company_id: this.modelFor( 'companies.view' ).get( 'id' ) } ) );
        controller.set( 'company_id', this.modelFor( 'companies.view' ).get( 'id' ) );
        controller.set( 'user', {
            first_name: null,
            last_name: null,
            email: null,
            phone_mobile: null
        } );
        controller.set( 'theExistingUser', {
            first_name: null,
            last_name: null,
            email: null,
            phone_mobile: null
        } );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/institution-users/add', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    }

} );

