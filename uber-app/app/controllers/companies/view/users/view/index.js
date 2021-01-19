import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],

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
        },
        "model.access": {
            presence: true
        }
    },

    actions: {
        updateUser: function(){
            var self = this;
            this.set( 'selectedPlot', this.get( 'analytics_option' ) );
            self.set( 'isLocked', true );
            self.validate().then( function(){
                self.set( 'isLocked', false );
                self.get( 'model' ).save().then( function(){
                    self.set( 'isLocked', false );
                    self.notify.info( 'Updated' );
                }, function( xhr ){
                    self.notify.error( xhr.responseJSON.error, { closeAfter: 5000 } );
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