import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import config from 'signup-app/config/environment';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    activate: function(){
        document.title = config.APP.company.name + " | Agreement";
    },
    model: function(){
        var _this = this;
        var adapter = _this.get( 'akxAdapter' );
        return adapter.sendRequest( '/agreements/latest' ).then( function( result ){
            return Ember.RSVP.resolve( result.data );
        } );
    },
    afterModel: function( model, transition ){
        Ember.run.schedule( 'afterRender', this, function(){
            window.print();
        } );
    }
} );
