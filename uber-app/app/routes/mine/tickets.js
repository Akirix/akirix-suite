import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import PaginationRouteMixin from 'ember-cli-pagination/remote/route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, PaginationRouteMixin, {
    model: function( params ){
        return this.store.find( 'ticket', { status: 0, uber_user_id: this.get( 'session.user.id' ) } );
    },

    renderTemplate: function(){
        this.render( 'mine/tickets', {
            into: 'mine',
            outlet: 'panePrimary'
        } );
    }
} );