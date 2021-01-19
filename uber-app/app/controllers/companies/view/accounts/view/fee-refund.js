import Ember from 'ember';
import DS from 'ember-data';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {

    needs: [ 'application' ],

    validations: {
        "data.amount": {
            presence: true,
            numericality: {
                greaterThan: 0
            }
        },
        "data.notes": {
            presence: true
        }
    },


    actions: {
        issueRefund: function(){
            var self = this;
            this.validate().then(
                function(){
                    Ember.run( function(){
                        Ember.$.ajax( {
                            url: config.APP.uber_api_host + '/accounts/' + self.get( 'model.id' ) + '/feeRefund',
                            type: 'POST',
                            contentType: "application/json; charset=utf-8",
                            dataType: 'json',
                            data: JSON.stringify( { data: self.get( 'data' ) } )
                        } ).then(
                            function( response ){
                                self.transitionToRoute( 'companies.view.accounts' );
                                self.notify.success( 'Refund Issued', { closeAfter: 5000 } );
                            },
                            function( xhr, status, error ){
                                self.get( 'akxUtil' ).handleError( xhr, {
                                    scope: self
                                } );
                            }
                        );
                    } );
                },
                function( errors ){

                }
            );
        }
    }
} );
