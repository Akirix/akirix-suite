import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';

export default Ember.View.extend( EmberValidations.Mixin, {
    isLoading: true,
    hasKey: false,
    hasApp: false,
    hasVoice: false,
    validations: {
        code: {
            presence: true
        }
    },
    layoutName: 'views/authenticate',
    voices: function(){
        return this.get( 'authenticators' ).filterBy( 'type', 4 );
    }.property( 'authenticators@each.status' ),


    init: function(){
        this._super();
        var self = this;
        this.get( 'controller.store' ).find( 'uber-authenticator' ).then(
            function( authenticators ){
                self.set( 'authenticators', authenticators );
                self.set( 'isLoading', false );
                authenticators.forEach( function( authenticator ){
                    if( authenticator.get( 'status' ) === 1 ){
                        switch( authenticator.get( 'type' ) ){
                            case 0:
                            case 1:
                            case 2:
                                self.set( 'hasApp', true );
                                break;
                            case 3:
                                self.set( 'hasKey', true );
                                break;
                            case 4:
                                self.set( 'hasVoice', true );
                                break;
                        }
                    }
                } );

            },
            function(){
            }
        );
    },

    keyPress: function( event ){
        if( event.which === 13 ){
            this.send( 'authenticate' );
            event.preventDefault();
        }
    },

    actions: {
        twoFactorSms: function(){
            var self = this;
            Ember.run( function(){
                Ember.$.ajax( {
                    url: config.APP.uber_api_host + '/uberAuthenticators/sms',
                    type: 'POST',
                    contentType: "application/json; charset=utf-8",
                    dataType: 'json'
                } ).then(
                    function( response ){
                        self.get( 'controller.notify' ).success( response.message, { closeAfter: 5000 } );
                    },
                    function( xhr, status, error ){
                        self.get( 'controller.notify' ).error( 'There was an error sending the text message', { closeAfter: 5000 } );
                    }
                );
            } );
        },

        voiceCall: function(){
            var self = this;
            var payload = {
                code: 'voice',
                authenticator_id: this.get( 'authenticator_id' )
            };
            Ember.run( function(){
                Ember.$.ajax( {
                    url: config.APP.uber_api_host + '/uberAuthenticators/auth',
                    type: 'POST',
                    contentType: "application/json; charset=utf-8",
                    dataType: 'json',
                    data: JSON.stringify( { data: payload } )
                } ).then( function( response ){
                        self.set( 'isCalling', true );
                    },
                    function( xhr, status, error ){
                        self.get( 'controller' ).get( 'akxUtil' ).handleError( xhr, {
                            scope: self
                        } );
                    } );
            } );
        },

        authenticate: function(){
            var self = this;
            var payload = {
                code: this.get( 'code' )
            };

            this.validate().then( function(){
                    Ember.run( function(){
                        Ember.$.ajax( {
                            url: config.APP.uber_api_host + '/uberAuthenticators/auth',
                            type: 'POST',
                            contentType: "application/json; charset=utf-8",
                            dataType: 'json',
                            data: JSON.stringify( { data: payload } )
                        } ).then( function( response ){
                                self.send( 'closePane' );
                            },
                            function( xhr, status, error ){
                                self.get( 'controller' ).get( 'akxUtil' ).handleError( xhr, {
                                    scope: self
                                } );
                            } );
                    } );
                },
                function(){

                } );
        },

        closePane: function(){
            Ember.$( '#overpane' ).removeClass( 'fadeInUpBig' ).addClass( 'fadeOutDownBig' );
            Ember.$( '.modal-backdrop.in' ).remove();
        },

        cancelTwoFactorPane: function(){
            this.send( 'closePane' );
            this.get( 'controller' ).send( 'goBack' );
        }
    }
} );
