import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {

    needs: [ 'application' ],

    validations: {
        'model.title': {
            presence: true
        },
        'model.notes_new': {
            presence: true
        }
    },

    priorities: [
        { label: 'Low', val: 0 },
        { label: 'Normal', val: 1 },
        { label: 'High', val: 2 }
    ],

    sentiments: [
        { label: 'Negative', val: 0 },
        { label: 'Neutral', val: 1 },
        { label: 'Positive', val: 2 }
    ],

    status: [
        { label: 'Not Started', val: 0 },
        { label: 'In Progress', val: 1 },
        { label: 'Completed', val: 2 }
    ],


    actions: {

        updateTask: function(){
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
        }

    }

} );