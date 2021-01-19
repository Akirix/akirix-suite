import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function(){
        var user = this.modelFor( 'companies.view.users.view' );
        var company = this.modelFor( 'companies.view' );

        return Ember.RSVP.hash( {
            securityQuestionsForCompany: this.store.find( 'security-question', { company_id: company.id, user_id: null } ),
            securityQuestionsForUser: this.store.find( 'security-question', { user_id: user.id } )
        } );
    },

    setupController: function( controller, model ){
        controller.set( 'manualQuestionsCompany', model.securityQuestionsForCompany.filterBy( 'type', 1 ) );
        controller.set( 'generatedQuestionsCompany', model.securityQuestionsForCompany.filterBy( 'type', 0 ) );
        controller.set( 'manualQuestionsUser', model.securityQuestionsForUser.filterBy( 'type', 1 ) );
        controller.set( 'generatedQuestionsUser', model.securityQuestionsForUser.filterBy( 'type', 0 ) );
    },

    renderTemplate: function(){
        this.render( 'companies/users/security-questions', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    },

    activate: function(){
        document.title = this.modelFor( 'companies.view.users.view' ).get( 'name' ) + ' | Security Questions';
    }
} );