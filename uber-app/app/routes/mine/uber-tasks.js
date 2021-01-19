import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'uber-task', { status: [ 0, 1 ], type: 0, uber_user_id: this.get( 'session.user.id' ) } );
    },

    renderTemplate: function(){
        this.render( 'mine/uber-tasks', {
            into: 'mine',
            outlet: 'panePrimary'
        } );
    }
} );