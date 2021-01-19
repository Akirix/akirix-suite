import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'institution-user', this.modelFor( 'companies.view.institution-users.view' ).get('id') );
    },
    renderTemplate: function(){
        this.render( 'companies/institution-users/add-verification', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    },
    setupController: function( controller, model ){
        controller.set( 'user', model );
        controller.set( 'verification', {
            type: null
        } );
        controller.set( 'password', null );
    },
    activate: function(){
        document.title = this.modelFor( 'companies.view.institution-users.view' ).get( 'name' ) + ' | Add Verification';
    }
} );

