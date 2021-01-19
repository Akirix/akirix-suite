import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],
    queryParams: [ 'token', 'email' ],
    token: null,

    validations: {
        password: {
            presence: true,
            confirmation: true
        }
    },

    actions: {
        reset: function(){
            var self = this;
            this.validate().then(
                function(){
                    var token = self.get( 'token' );
                    var email = self.get( 'email' );
                    var password = self.get( 'password' );

                    self.set( 'isLocked', true );
                    Ember.run( function(){
                        Ember.$.ajax( {
                            url: config.APP.uber_api_host + '/uberUsers/password_reset?token=' + token + '&email=' + email,
                            dataType: 'json',
                            type: 'POST',
                            data: { password: password }
                        } ).then(
                            function( response ){
                                self.set( 'isLocked', false );
                                self.notify.success( 'Your password has been reset. Please login with your new password.', { closeAfter: 5000 } );
                                self.transitionToRoute( 'login' );
                            },
                            function( xhr, status, error ){
                                self.set( 'isLocked', false );
                                self.get( 'akxUtil' ).handleError( xhr, {
                                    scope: self
                                } );
                            } );
                    } );
                },
                function(){
                }
            );
        }
    }
} );
