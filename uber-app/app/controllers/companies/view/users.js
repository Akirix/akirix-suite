import Ember from 'ember';
import config from 'uber-app/config/environment';

export default Ember.ArrayController.extend( {
    needs: [ 'application' ],
    paneSecondary: null,

    activeUsers: function(){
        return this.get( 'model' ).filterBy( 'status', 1 );
    }.property( 'model' ),

    inactiveUsers: function(){
        return this.get( 'model' ).filterBy( 'status', 0 );
    }.property( 'model' ),

    actions: {
        resetPassword: function( userId ){
            var self = this;
            Ember.run( function(){
                Ember.$.ajax( {
                    url: config.APP.uber_api_host + '/users/' + userId + '/password_reset',
                    type: 'POST',
                    contentType: "application/json; charset=utf-8"
                } ).then(
                    function( response ){
                        self.notify.success(
                            'Password for user has been reset to: ' + response.password,
                            {
                                closeAfter: null
                            }
                        );
                    },
                    function( xhr, status, error ){
                        self.get( 'akxUtil' ).handleError( xhr, {
                            scope: self
                        } );
                    } );
            } );
        },

        impersonate: function( userId ){
            var self = this;
            Ember.run( function(){
                return new Ember.RSVP.Promise( function( resolve, reject ){
                    Ember.$.ajax( {
                        url: config.APP.uber_api_host + '/users/' + userId + '/impersonate',
                        type: 'POST',
                        contentType: "application/json; charset=utf-8"
                    } ).then(
                        function( response ){
                            window.open( config.APP.app_host + '/login?token=' + response.access_token );
                        },
                        function( xhr, status, error ){
                            self.get( 'akxUtil' ).handleError( xhr, {
                                scope: self
                            } );
                        } );
                } );
            } );
        }
    }
} );