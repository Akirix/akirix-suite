import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import config from 'signup-app/config/environment';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    activate: function(){
        document.title = config.APP.company.name + " | Complete";
    },

    model: function(){
        var registration = this.modelFor( 'application' );
        var accountType = registration.get( 'account_type' );

        return this.get( 'akxAdapter' ).sendRequest( '/document-types' ).then( function( result ){
            var model = result.data.filter( function( documentType ){
                var accountTypes = Ember.get( documentType, 'account_type' );
                return accountTypes.contains( accountType );
            } );

            return Ember.RSVP.resolve( model );
        } );
    }
} );
