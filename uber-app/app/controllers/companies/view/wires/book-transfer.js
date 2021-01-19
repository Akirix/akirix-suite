import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';
var locale = new Globalize( navigator.language );

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],
    company: null,

    validations: {
        'wire.account_number': {
            presence: true,
            numericality: {
                notEqualTo: 'controllers.application.company.account_number'
            }
        },
        'wire.account_id': {
            presence: true

        },
        'wire.amount': {
            presence: true,
            numericality: {
                greaterThan: 0,
                lessThanOrEqualTo: 'account.balance'
            }
        },
        'wire.fee': {
            presence: true,
            numericality: {
                greaterThanOrEqualTo: 0
            }
        }
    },

    str_amount: function(){
        return locale.format( Number( this.get( 'wire.amount' ) ), 'n2' );
    }.property( 'wire.amount' ),

    fee_amount: function(){
        if( !Ember.isEmpty( this.get( 'account' ) ) && !Ember.isEmpty( this.get( 'account.company.fees' ).objectAt( 0 ) ) && !Ember.isEmpty( this.get( 'wire.amount' ) ) ){
            var feeAmt = math.round( this.get( 'wire.amount' ) * this.get( 'account.company.fees' ).objectAt( 0 ).get( 'fee_book_transfer' ), 2 );
            this.set( 'wire.fee', feeAmt );
        }
    }.observes( 'account.company.fees@each.fee_data', 'wire.amount' ),

    actions: {
        confirmation: function(){
            var self = this;
            self.set( 'isLocked', true );
            self.validate().then(
                function(){
                    var payload = {
                        company_id: self.get( 'account.company_id' ),
                        amount: self.get( 'wire.amount' ),
                        type: 2
                    };
                    Ember.$.ajax( {
                        url: config.APP.uber_api_host + '/wires/duplicates',
                        type: 'POST',
                        contentType: "application/json; charset=utf-8",
                        dataType: 'json',
                        data: JSON.stringify( payload )
                    } ).done( function( res ){
                        var dupWires = [];
                        res.wires.forEach( function( wire ){
                            dupWires.push( self.store.push( 'wire', self.store.normalize( 'wire', wire ) ) );
                        } );
                        self.set( 'duplicateWires', dupWires );
                        self.set( 'paneSecondary', 'wires/internal-confirmation' );
                    } );

                }
            );
        },

        createBookTransfer: function(){
            var self = this;
            this.validate().then(
                function(){
                    self.set( 'isLocked', true );

                    var newWire = self.store.createRecord( 'wire', {
                        account_id: self.get( 'wire.account_id' ),
                        account_number: self.get( 'wire.account_number' ),
                        amount: self.get( 'wire.amount' ),
                        notes: self.get( 'wire.notes' ),
                        method: 2,
                        type: 2,
                        fee: self.get( 'wire.fee' )
                    } );

                    newWire.save().then(
                        function(){
                            self.set( 'isLocked', false );
                            var route = self.container.lookup( 'route:companies.view.wires' );
                            self.notify.success( 'Internal transfer request submitted.', { closeAfter: 5000 } );
                            route.refresh();
                            self.transitionToRoute( 'companies.view.wires' );
                        },
                        function( xhr ){
                            self.get( 'akxUtil' ).handleError( xhr, {
                                scope: self
                            } );
                        } );
                },
                function(){

                }
            );
        }
    }
} );

