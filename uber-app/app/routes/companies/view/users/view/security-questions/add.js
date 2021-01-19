import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'user', this.modelFor( 'companies.view.users.view' ).id );
    },

    setupController: function( controller, model ){
        controller.set( 'user', model );
        controller.set( 'securityQuestion', {
            question: null,
            answer: null,
            type: null
        } );
    },

    renderTemplate: function(){
        this.render( 'companies/users/add-security-question', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    },

    activate: function(){
        document.title = this.modelFor( 'companies.view.users.view' ).get( 'name' ) + ' | Add Security Question';
    }
} )