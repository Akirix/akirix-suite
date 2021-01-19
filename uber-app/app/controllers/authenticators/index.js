import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    paneSecondary: 'authenticators/help-index',
    data: {
        code: null
    },

    needs: [ 'application' ],

    validations: {
        'data.code': {
            presence: true
        }
    },

    actions: {
        activateDevicePane: function( authenticator_id ){
            var self = this;
            var store = this.store;
            store.find( 'uberAuthenticator', authenticator_id ).then(
                function( authenticator ){
                    self.set( 'authenticator', authenticator );

                    if( authenticator.get( 'type' ) === 3 ){
                        self.set( 'paneSecondary', 'authenticators/activate-key' );
                    }
                    else{
                        self.set( 'paneSecondary', 'authenticators/activate' );
                    }

                    Ember.run.schedule( 'afterRender', this, function(){
                        self.set( 'data.code', null );
                        Ember.$( '#authentication_code' ).focus();
                    } );
                },
                function( xhr ){
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                } );
        },

        revokeDevice: function( authenticator_id ){
            var self = this;
            var store = this.store;
            store.find( 'uberAuthenticator', authenticator_id ).then(
                function( authenticator ){
                    authenticator.deleteRecord();

                    authenticator.save().then(
                        function(){
                            self.set( 'paneSecondary', 'authenticators/help-index' );
                            self.notify.success( 'The device has been revoked.', { closeAfter: 5000 } );
                        },
                        function( xhr ){
                            self.get( 'akxUtil' ).handleError( xhr, {
                                scope: self
                            } );
                        } );
                },
                function( xhr ){
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                } );
        },

        activateDevice: function(){
            var self = this;
            this.validate().then( function(){
                var auth = self.get( 'authenticator' );

                var payload = {
                    code: self.get( 'data.code' )
                };

                self.set( 'isLocked', true );
                return new Ember.RSVP.Promise( function( resolve, reject ){
                    Ember.$.ajax( {
                        url: config.APP.uber_api_host + '/uberAuthenticators/' + auth.id + '/activate',
                        type: 'POST',
                        contentType: "application/json; charset=utf-8",
                        dataType: 'json',
                        data: JSON.stringify( { data: payload } )
                    } ).then(
                        function( response ){
                            self.set( 'isLocked', false );
                            auth.set( 'status', 1 );
                            self.set( 'paneSecondary', 'authenticators/help-index' );
                            self.notify.success( 'The device has been activated.', { closeAfter: 5000 } );
                            resolve( response );
                        },
                        function( xhr ){
                            self.get( 'akxUtil' ).handleError( xhr, {
                                scope: self
                            } );

                            self.set( 'isLocked', false );
                            reject( xhr );
                        } );
                } );
            }, function(){

            } );
        }
    }
} );

