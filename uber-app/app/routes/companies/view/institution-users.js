import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        params.company_id = this.modelFor( 'companies.view' ).get( 'id' );
        return this.store.find( 'institution-user', params );
    },

    setupController: function( controller, model ){
        controller.set( 'company_id', this.modelFor( 'companies.view ' ) );
        controller.set( 'model', model );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/institution-users', {
            into: 'companies/view',
            outlet: 'companyPrimary'
        } );
        this.render( 'companies/nav-institution-users', {
            into: 'companies/view',
            outlet: 'companyNavbar'
        } );
    },

    activate: function(){
        document.title = this.modelFor( 'companies.view' ).get( 'name' ) + ' | Institution Users';
    }
} )