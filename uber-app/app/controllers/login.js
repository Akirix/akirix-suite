import Ember from 'ember';
import EmberValidations from 'ember-validations';
import LoginControllerMixin from 'simple-auth/mixins/login-controller-mixin';

export default Ember.Controller.extend( LoginControllerMixin, EmberValidations.Mixin, {
    queryParams: [ 'token' ],
    authenticator: 'authenticator:akx',
    token: null,
    needs: [ 'application' ],
    validations: {
        identification: {
            format: {
                with: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                allowBlank: false,
                message: 'Please enter a valid email'
            },
            presence: true
        },
        password: {
            presence: true
        }
    },

    actions: {
        login: function(){
            var self = this;
            this.validate().then(
                function(){
                    self.set( 'isLocked', true );
                    var data = { email: self.get( 'identification' ), password: self.get( 'password' ) };
                    if( !Ember.isEmpty( self.get( 'token' ) ) ){
                        data = { token: self.get( 'token' ) };
                    }
                    self.get( 'session' ).authenticate( 'authenticator:akx', data ).then(
                        function(){
                            self.set( 'isLocked', false );
                            // Success do nothing
                            self.transitionToRoute( 'dashboard.wire-summary' );
                        },
                        function( xhr ){
                            self.get( 'akxUtil' ).handleError( xhr, {
                                scope: self
                            } );

                            self.set( 'isLocked', false );
                        }
                    );
                },
                function(){
                }
            );
        }
    }

} );
