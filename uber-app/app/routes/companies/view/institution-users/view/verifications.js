import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function(){
        var user = this.modelFor( 'companies.view.institution-users.view' );
        return this.store.find( 'institution-verification', { user_id: user.get( 'id' ) } );
    },

    setupController: function( controller, model ){
        controller.set( 'model', model );
        controller.set( 'user', this.modelFor( 'companies.view.institution-users.view' ) );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/institution-users/verifications', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    },

    activate: function(){
        document.title = this.modelFor( 'companies.view.institution-users.view' ).get( 'str_long_name' ) + ' | Verifications';
    }
} )