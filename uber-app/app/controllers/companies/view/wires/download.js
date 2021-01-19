import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';

export default Ember.ArrayController.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],
    fileTypes: [
        { label: 'CSV', val: 'csv' }
    ],

    validations: {
        'type': {
            presence: true
        },
        'period_from': {
            presence: true
        },
        'period_to': {
            presence: true
        }
    },

    actions: {
        downloadWires: function(){
            var self = this;
            var token = self.get( 'session.access_token' );
            this.validate().then(
                function(){
                    var url = config.APP.uber_api_host + '/wires/download?token=' + token + '&file_type=' + self.get( 'type' ) + '&period_from=' + self.get( 'period_from' ) + '&period_to=' + self.get( 'period_to' ) + '&company_id=' + self.get( 'company_id' );
                    window.open( url, '_self', false );

                },
                function(){

                }
            );
        }
    }
} );

