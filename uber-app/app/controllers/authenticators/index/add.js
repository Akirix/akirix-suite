import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],

    deviceTypes: [
        { label: 'Phone', val: 0 },
        { label: 'Tablet', val: 1 },
        { label: 'Voice', val: 4 },
        { label: 'Other', val: 2 }
    ],

    validations: {
        'authenticator.name': {
            presence: true
        },
        'authenticator.type': {
            presence: true
        }
    },

    actions: {

        addDevice: function(){
            var self = this;
            this.validate().then(
                function(){
                    var newDevice = self.store.createRecord( 'uberAuthenticator', {
                        name: self.get( 'authenticator.name' ),
                        type: self.get( 'authenticator.type' )
                    } );

                    self.set( 'isLocked', true );

                    newDevice.save().then(
                        function(){
                            self.set( 'isLocked', false );
                            self.transitionToRoute( 'authenticators' );
                            self.notify.success( 'Device added successfully', { closeAfter: 5000 } );
                        },
                        function( xhr ){
                            self.set( 'isLocked', false );
                            self.get( 'akxUtil' ).handleError( xhr, {
                                scope: self
                            } );
                        } );
                },
                function(){

                }
            );
        }
    }
} );

