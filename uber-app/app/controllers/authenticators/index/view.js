import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],
    session: Ember.inject.service( 'session' ),

    data: {
        code: null
    },

    validations: {
        'data.code': {
            presence: true
        }
    },
    authenticator: {},
    isCalling: false,


    actions: {
        revokeDevice: function(){
            var self = this;
            var authenticator = self.get( 'authenticator' );
            authenticator.destroyRecord().then(
                function(){
                    self.set( 'paneSecondary', 'authenticators/help-index' );
                    self.notify.success( 'The authenticator has been removed.', { closeAfter: 5000 } );
                    var route = self.container.lookup( 'route:authenticators' );
                    route.refresh();
                    self.transitionToRoute( 'authenticators' );
                },
                function( xhr ){
                    authenticator.rollback();

                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                } );
        },

        activateDevice: function(){
            var self = this;
            var authenticator = self.get( 'authenticator' );
            this.validate().then( function(){
                var payload = {
                    code: self.get( 'data.code' )
                };
                self.set( 'isLocked', true );
                Ember.$.ajax( {
                    url: config.APP.uber_api_host + '/uberAuthenticators/' + authenticator.id + '/activate',
                    type: 'POST',
                    contentType: "application/json; charset=utf-8",
                    dataType: 'json',
                    data: JSON.stringify( { data: payload } )
                } ).then(
                    function( response ){
                        Ember.run( function(){
                            self.set( 'isLocked', false );
                            authenticator.set( 'status', 1 );
                            self.notify.success( 'The device has been activated.', { closeAfter: 5000 } );
                            var route = self.container.lookup( 'route:authenticators' );
                            route.refresh();
                            self.transitionToRoute( 'authenticators' );
                        } );
                    },
                    function( xhr ){
                        self.get( 'akxUtil' ).handleError( xhr, {
                            scope: self
                        } );
                        self.set( 'isLocked', false );
                    } );

            } );
        },

        activateDeviceVoice: function(){
            var self = this;

            var auth = self.get( 'authenticator' );
            self.set( 'isLocked', true );

            Ember.run( function(){
                Ember.$.ajax( {
                    url: config.APP.uber_api_host + '/uberAuthenticators/' + auth.id + '/activate',
                    type: 'POST',
                    contentType: "application/json; charset=utf-8"
                } ).then(
                    function( response ){
                        Ember.run( function(){
                            self.set( 'isLocked', false );
                            self.set( 'isCalling', true );
                        } );
                    },
                    function( xhr ){
                        Ember.run( function(){
                            self.get( 'akxUtil' ).handleError( xhr, {
                                scope: self
                            } );
                            self.set( 'isLocked', false );
                        } );
                    } );
            } );
        }
    }
} );
