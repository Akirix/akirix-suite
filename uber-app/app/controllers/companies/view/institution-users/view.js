import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],
    //validations: IN THE ROUTE THE USER SHOULD BE DEFINIED AS THE MODEL
    validations: {
        "model.email": {
            presence: true,
            format: {
                with: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
                allowBlank: false,
                message: 'Please enter a valid email'
            }
        },
        "model.first_name": {
            presence: true
        },
        "model.last_name": {
            presence: true
        },
        "model.phone_mobile": {
            presence: true
        }
    },
    actions: {
        updateInstitutionUser: function(){
            var self = this;
            self.set( 'isLocked', true );
            
            self.validate().then( function(){
                self.set( 'isLocked', false );
                self.get( 'model' ).save().then( function(){
                    self.set( 'isLocked', false );
                    self.notify.info( 'Updated' );
                }, function( xhr ){
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                } );
            }, function( errors ){
                self.set( 'isLocked', false );
            } );
        },
    }
} );


