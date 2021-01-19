import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import config from 'signup-app/config/environment';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    activate: function(){
        document.title = config.APP.company.name + " | Complete";
        Ember.run.scheduleOnce( 'afterRender', function(){
            Ember.$( '.process-row' ).addClass( 'completed' );
            Ember.$( '.status-icon' ).addClass( 'all-completed' );
        } );
    }
} );
