import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],

    validations: {
        email: {
            format: {
                with: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
                allowBlank: false,
                message: 'Please enter a valid email'
            },
            presence: true
        },
        toth: {
            presence: true
        }
    },

    actions: {
        forgot: function(){
            var self = this;
            this.validate().then(
                function(){
                    self.set( 'isLocked', true );

                    Ember.run( function(){
                        Ember.$.ajax( {
                            url: config.APP.uber_api_host + '/uberUsers/forgot',
                            type: 'POST',
                            dataType: 'json',
                            data: {
                                email: self.get( 'email' ),
                                toth: self.get( 'toth' )
                            }
                        } ).then(
                            function( response ){
                                self.set( 'isLocked', false );
                                self.notify.success( 'Password recovery instructions have been sent.', { closeAfter: 5000 } );
                                self.transitionToRoute( 'login' );
                            },
                            function( xhr, status, error ){
                                self.get( 'akxUtil' ).handleError( xhr, {
                                    scope: self
                                } );
                                self.set( 'isLocked', false );
                            }
                        );
                    } );
                },
                function(){
                } );
        }
    }
} );
