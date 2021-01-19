import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {

    model: function(){
        return null;
    },

    activate: function(){
        document.title = "Dashboard";
        this.transitionTo( 'dashboard.wire-summary' );
    }
} );
