import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';
var locale = new Globalize( navigator.language );


export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],

    validations: {
        'model.rate': {
            presence: true,
            numericality: {
                greaterThan: 0,
                lessThan: 50
            }
        },
        'model.start_date': {
            presence: true
        },
        'model.end_date': {
            presence: true
        }
    },

    actions: {
        updateCommission: function(){
            var self = this;
            this.validate().then( function(){
                self.set( 'isLocked', false );
                self.get( 'model' ).save().then( function(){
                    self.set( 'isLocked', false );
                    self.notify.success( 'Commission updated', { closeAfter: 5000 } );
                }, function( xhr ){
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                } );
            }, function( errors ){
                self.set( 'isLocked', false );
            } );
        }
    }
} );


