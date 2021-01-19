import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],
    user_id: null,
    password: '',
    passwordConfirmation: null,
    paneSecondary: 'uber-users/help-view',

    validations: {
        password: {
            presence: true,
            confirmation: true,
            passwordRequirements: true
        }
    },

    actions: {
        updateUser: function(){
            var self = this;
            this.validate().then(
                function(){
                    var uberUser = self.get( 'uberUser' );

                    if( !Ember.isEmpty( self.get( 'password' ) ) ){
                        uberUser.set( 'password', self.get( 'password' ) );
                    }

                    self.set( 'isLocked', true );
                    uberUser.save().then(
                        function(){
                            self.set( 'isLocked', false );
                            self.set( 'password', '' );
                            self.set( 'passwordConfirmation', null );
                            self.notify.success( 'Account settings have been updated.', { closeAfter: 5000 } );
                        },
                        function( xhr ){
                            self.get( 'akxUtil' ).handleError( xhr, {
                                scope: self
                            } );

                            self.set( 'isLocked', false );
                        } );
                },
                function(){

                }
            );
        }

    }
} );

