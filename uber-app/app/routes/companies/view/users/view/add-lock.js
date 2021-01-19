import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    renderTemplate: function( controller, model ){
        this.render( 'companies/users/add-lock', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    },
    activate: function(){
        document.title = this.modelFor( 'companies.view.users.view' ).get( 'name' ) + ' | Add Lock';
    }
} );

