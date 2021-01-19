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
        createSubmission: function(){
            var self = this;
            self.validate().then( function(){

                var newSubmision = self.store.createRecord( 'uber-sar-submission',
                    {
                        type: self.get('uberSarSubmission.type'),
                        reference: self.get('uberSarSubmission.reference'),
                        status: self.get('uberSarSubmission.status'),
                        confirmation: self.get('uberSarSubmission.confirmation'),
                        uber_sar_report_id: self.get('uber_sar_report_id')
                    });

                newSubmision.save().then(
                    function(){
                        self.set( 'isLocked', false );
                        self.notify.success( 'SAR Submission Created', { closeAfter: 5000 } );

                        var route = self.container.lookup( 'route:uber-sar-reports' );
                        route.refresh();
                        self.transitionToRoute( 'uber-sar-reports' );

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