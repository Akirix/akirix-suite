import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {

    model: function(){
        return this.store.find( 'uber-user-cache', this.get( 'session.user.id' ) );
    },

    renderTemplate: function(){
        this.render( 'uber-user-caches/index', {
            into: 'uber-user-caches',
            outlet: 'panePrimary'
        } );
    }
} );