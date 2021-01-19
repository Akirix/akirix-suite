import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend( AuthenticatedRouteMixin, {

    activate: function(){
        document.title = 'Registrations';
    },

    model: function( params ){
        return null;
    }

} );
