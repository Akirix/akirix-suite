import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {

    submissionTypes: [
        { label: 'FinCEn', val: 0 },
        { label: 'goAML', val: 1 }
    ],

    submissionStatuses: [
        { label: 'Started', val: 0 },
        { label: 'Sent', val: 1 },
        { label: 'Confirmed', val: 2 }
    ],
    needs: [ 'application' ],

    validations: {
        'uberSarSubmission.type': {
            presence: true
        },
        'uberSarSubmission.status': {
            presence: true
        },

    },

    actions: {
        saveSubmission: function(){
            var self = this;

            var submission = this.get( 'uberSarSubmission' );
            self.validate().then( function(){

                submission.save().then(
                    function(){
                        self.set( 'isLocked', false );
                        self.notify.success( 'Submission Updated', { closeAfter: 5000 } );
                    },
                    function( xhr ){
                        self.set( 'isLocked', false );
                        self.get( 'akxUtil' ).handleError( xhr, {
                            scope: self
                        } );

                        self.set( 'isLocked', false );
                    }
                );
            } );
        },


    }
} );