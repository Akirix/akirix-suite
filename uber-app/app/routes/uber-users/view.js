import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
import config from 'uber-app/config/environment';

export default Ember.Route.extend( AuthenticatedRouteMixin, {
    model: function( params ){
        return this.store.find( 'uber-user', this.get( 'session.user.id' ) );
    },
    setupController: function( controller, model ){
        controller.set( 'uberUser', model );

        Ember.$.ajax( {
            url: config.APP.uber_api_host + '/uberTokens/toth',
            type: 'GET'
        } ).then(
            function( response ){
                //var toth = JSON.parse( response.toth );
                var toth = response.toth;
                if( toth ){
                    controller.set( 'toth', toth );
                }
                else{
                    controller.set( 'toth', '' );
                }
            },
            function( xhr ){
                controller.get( 'akxUtil' ).handleError( xhr, {
                    scope: controller
                } );
            }
        );
    },

    renderTemplate: function( controller, model ){
        this.render( { outlet: 'panePrimary' } );
        this.render( 'uber-users/pane-secondary', {
            into: 'uber-users',
            outlet: 'paneSecondary'
        } );
    },

    actions: {}

} );
