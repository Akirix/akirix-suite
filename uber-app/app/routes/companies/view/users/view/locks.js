import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        var user = this.modelFor( 'companies.view.users.view' );
        return this.store.find( 'lock', { user_id: user.id } );
    },
    renderTemplate: function( controller, model ){
        this.render( 'companies/users/locks', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    },
    activate: function(){
        document.title = this.modelFor( 'companies.view.users.view' ).get( 'name' ) + ' | Locks';
    },
    actions: {
        refreshLocks: function(){
            return this.refresh();
        }
    }
} );

