import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function(){
        var user = this.modelFor( 'companies.view.users.view' );
        return this.store.find( 'verification', { user_id: user.id } );
    },

    setupController: function( controller, model ){
        controller.set( 'model', model );
        controller.set( 'user', this.modelFor( 'companies.view.users.view' ) );
    },

    renderTemplate: function( controller, model ){
        this.render( 'companies/users/verifications', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    },

    activate: function(){
        document.title = this.modelFor( 'companies.view.users.view' ).get( 'name' ); + ' | Verifications';
    }
} )