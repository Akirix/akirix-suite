import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {

    model: function( params ){
        var user = this.modelFor( 'companies.view.users.view' );
        return this.store.find( 'access-log', { user_id: user.id } );
    },
    renderTemplate: function( controller, model ){
        this.render( 'companies/users/access-logs', {
            into: 'companies',
            outlet: 'paneSecondary'
        } );
    },
    activate: function(){
        document.title = this.modelFor( 'companies.view.users.view' ).get( 'name' ) + ' | access-logs';
    },
} );

