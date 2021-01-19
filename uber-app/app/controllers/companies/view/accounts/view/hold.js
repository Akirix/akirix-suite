import Ember from 'ember';
import DS from 'ember-data';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {

    needs: [ 'application' ],
    paneSecondary: 'accounts/lock',

    data: {
        amount: null
    },

    maxAmount: function(){
        return this.get( 'model.balance' ) + this.get( 'model.balance_hold' );
    }.property( 'model.balance', 'model.balance_hold' ),

    validations: {
        "data.amount": {
            presence: true,
            numericality: {
                greaterThanOrEqualTo: 0,
                lessThanOrEqualTo: 'maxAmount',
                messages: {
                    lessThanOrEqualTo: 'Amount must be less than available balance'
                }
            }
        }
    },


    actions: {

        holdFund: function(){
            var self = this;
            this.validate().then(
                function(){
                    return new Ember.RSVP.Promise( function( resolve, reject ){
                        Ember.run( function(){
                            Ember.$.ajax( {
                                url: config.APP.uber_api_host + '/accounts/' + self.get( 'model.id' ) + '/hold',
                                type: 'POST',
                                contentType: "application/json; charset=utf-8",
                                dataType: 'json',
                                data: JSON.stringify( { data: self.get( 'data' ) } )
                            } ).then(
                                function( response ){
                                    resolve();
                                },
                                function( xhr, status, error ){
                                    reject( xhr );
                                }
                            );
                        } );
                    } )
                        .then( function(){
                            self.notify.success( 'Cash on hold updated.', { closeAfter: 5000 } );
                            var route = self.container.lookup( 'route:companies.view.accounts' );
                            route.refresh();
                        } )
                        .catch( function( xhr ){
                            self.get( 'controller.akxUtil' ).handleError( xhr, {
                                scope: self
                            } );
                        } );

                }, function( errors ){
                    self.set( 'isLocked', false );
                }
            );
        }
    }
} );
