import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';
var locale = new Globalize( navigator.language );

export default Ember.Controller.extend( EmberValidations.Mixin, {

    needs: [ 'application' ],

    validations: {
        'data.base_amount': {
            presence: true,
            numericality: {
                greaterThan: 0
            }
        },
        'data.counter_currency_id': {
            presence: true
        },
        'data.from_account_id': {
            presence: true
        },
        'data.type': {
            presence: true
        },
        'data.base_rate': {
            presence: true,
            numericality: {
                greaterThan: 0
            }
        },
        'data.customer_rate': {
            presence: true,
            numericality: {
                greaterThan: 0,
                smallerThan: 'data.base_rate'
            }
        }
    },

    fxMethods: [
        { label: 'Akirix FX', val: 1 },
        { label: 'External FX', val: 0 }
    ],

    targetCurrencies: function(){
        var self = this;
        this.set( 'data.counter_currency_id', null );
        return this.get( 'currencies' ).filter( function( item ){
            return ( item.get( 'id' ) !== self.get( 'fromAccount.currency_id' ) ) && (item.get( 'id' ) !== self.get( 'fromAccount.id' ) );
        } );
    }.property( 'fromAccount.id' ),

    targetAccounts: function(){
        if( !Ember.isEmpty( this.get( 'data.counter_currency_id' ) ) ){
            var self = this;
            this.set( 'data.to_account_id', null );
            return this.get( 'accounts' ).filter( function( item ){
                return ( item.get( 'currency_id' ) === self.get( 'data.counter_currency_id' ));
            } );
        }
    }.property( 'data.counter_currency_id' ),

    liveRate: function(){
        var self = this;

        if( this.get( 'fromAccount.currency_id' ) && this.get( 'data.counter_currency_id' ) && this.get( 'data.base_amount' ) ){
            Ember.run( function(){
                Ember.$.ajax( {
                    url: config.APP.uber_api_host + '/fxRequests/rates?base_currency_id=' + self.get( 'fromAccount.currency_id' ) + '&counter_currency_id=' + self.get( 'data.counter_currency_id' ) + '&amount=' + Number( self.get( 'data.base_amount' ) ) + '&from_account_id=' + self.get( 'data.from_account_id' ),
                    type: 'GET'
                } ).then( function( response ){
                    self.set( 'data.customer_rate', response.customer_rate );
                    self.set( 'data.counter_amount', response.counter_amount );
                    self.set( 'data.cost_amount', response.cost_amount );
                    self.set( 'data.base_rate', response.base_rate );
                } );
            } );
        }
    }.observes( 'fromAccount.currency_id', 'data.counter_currency_id', 'data.base_amount' ),

    recalculateFee: function(){
        if( Number( this.get( 'data.customer_rate' ) ) > 0 && Number( this.get( 'data.base_rate' ) ) > 0 && Number( this.get( 'data.base_amount' ) > 0 ) ){
            var feePercentage = ( Number( this.get( 'data.base_rate' ) ) - Number( this.get( 'data.customer_rate' ) ) ) / Number( this.get( 'data.base_rate' ) ) * 100;
            var counterAmount = Number( this.get( 'data.base_amount' ) ) * Number( this.get( 'data.customer_rate' ) );
            var totalCounterAmount = Number( this.get( 'data.base_amount' ) ) * Number( this.get( 'data.base_rate' ) );
            var feeAmount = totalCounterAmount - counterAmount;

            this.set( 'data.fee_percentage', math.round( feePercentage, 2 ) + '%' );
            this.set( 'data.fee_amount', math.round( feeAmount, 2 ) );
            this.set( 'data.counter_amount', math.round( counterAmount, 2 ) );
            this.set( 'data.total_counter_amount', math.round( totalCounterAmount, 2 ) );
        }
    }.observes( 'data.base_amount', 'data.base_rate', 'data.customer_rate' ),

    actions: {
        addRequest: function(){
            var self = this;
            this.validate().then(
                function(){
                    var newRequest = self.store.createRecord( 'fx-request', {
                        from_account_id: self.get( 'data.from_account_id' ),
                        base_currency_id: self.get( 'fromAccount.currency_id' ),
                        counter_currency_id: self.get( 'data.counter_currency_id' ),
                        base_amount: self.get( 'data.base_amount' ),
                        to_account_id: self.get( 'data.to_account_id' ),
                        notes: self.get( 'data.notes' ),
                        base_rate: self.get( 'data.base_rate' ),
                        customer_rate: self.get( 'data.customer_rate' ),
                        type: self.get( 'data.type' )
                    } );

                    self.set( 'isLocked', true );
                    newRequest.save().then(
                        function(){
                            self.set( 'isLocked', false );
                            var route = self.container.lookup( 'route:companies.view.fx-requests' );
                            route.refresh();
                            self.transitionToRoute( 'companies.view.fx-requests' );
                        },
                        function( xhr ){
                            self.set( 'isLocked', false );
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

