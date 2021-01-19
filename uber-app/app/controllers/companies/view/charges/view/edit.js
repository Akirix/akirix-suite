import Ember from 'ember';
import EmberValidations from 'ember-validations';
var locale = new Globalize( navigator.language );

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],

    validations: {
        'model.amount': {
            presence: true,
            numericality: {
                greaterThan: 0
            }
        },
        'model.type': {
            presence: true
        },
        'model.account_id': {
            presence: true
        },
        'model.start_date': {
            presence: true
        },
        'model.title': {
            presence: true
        },
        'model.frequency': {
            presence: true
        },
        'model.frequency_type': {
            presence: true
        }
    },

    actions: {
        updateCharge: function(){
            var self = this;
            this.validate().then( function(){

                self.set( 'isLocked', true );
                var chargeModel = self.get( 'model' );

                function getNxtPay(){
                    var nextpayment;
                    var type = self.get( 'model.type' );
                    if( type === 0 ){
                        nextpayment = self.get( 'model.start_date' );
                        return nextpayment;
                    }
                    else{
                        return null;
                    }
                }

                chargeModel.setProperties( {
                    status: 0,
                    amount: self.get( 'model.amount' ),
                    account_id: self.get( 'model.account_id' ),
                    next_payment_date: getNxtPay(),
                    start_date: new Date( self.get( 'model.start_date' ) ),
                    title: self.get( 'model.title' ),
                    frequency: self.get( 'model.frequency' ),
                    frequency_type: self.get( 'model.frequency_type' ),
                    type: self.get( 'model.type' ),
                    company_id: '' + self.get( 'company_id' ) + '',
                    notes: self.get( 'model.notes' )
                } );

                chargeModel.save().then( function(){
                    self.set( 'isLocked', false );
                    self.notify.success( 'Update complete', { closeAfter: 5000 } );
                    var route = self.container.lookup( 'route:companies.view.charges' );
                    route.refresh();
                    self.transitionToRoute( 'companies.view.charges' );
                }, function( xhr ){
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                } );
                self.set( 'isLocked', false );

            } );
        }

    }
} );