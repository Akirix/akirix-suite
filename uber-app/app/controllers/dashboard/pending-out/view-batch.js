import Ember from 'ember';
import config from 'uber-app/config/environment';
import EmberValidations from 'ember-validations';
import _ from 'lodash/lodash';

var locale = new Globalize( navigator.language );


export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],

    batchMoneyData: [],
    hasError: false,

    validations: {
        'wireBatch.bank_route_id': {
            presence: true
        }
    },

    dataUpdated: function(){
        var self = this;
        var currencyArray = [];
        self.get( 'wireBatch.wires' ).forEach( function( wire ){
            var idx = _.findIndex( currencyArray, { currency_id: wire.get( 'currency_id' ) } );
            if( idx === -1 ){
                currencyArray.push(
                    {
                        currency_id: wire.get( 'currency_id' ),
                        amount: wire.get( 'amount' ),
                        str_amount: locale.format( Number( wire.get( 'amount' ) ), 'n2' ),
                        input: null,
                        errors: []
                    }
                );
            }
            else{
                currencyArray[ idx ].amount += wire.get( 'amount' );
                currencyArray[ idx ].str_amount = locale.format( Number( currencyArray[ idx ].amount ), 'n2' );
            }
        } );
        this.set( 'batchMoneyData', currencyArray );
    }.observes( 'wireBatch.wires.@each.currency_id', 'wireBatch.wires.@each.amount' ),

    inputUpdated: function(){
        var self = this;
        var currencies = this.get( 'batchMoneyData' );
        currencies.forEach( function( item, index, enumerable ){
            if( !item.input || Number( item.input ) !== math.round( item.amount, 2 ) ){
                self.set( 'hasError', true );
                Ember.set( item, 'errors', [ 'Amounts do not match' ] );
            }
            else{
                Ember.set( item, 'errors', [] );
                self.set( 'hasError', false );
            }
        } );
    }.observes( 'batchMoneyData.@each.input' ),

    updateBatch: function(){
        this.get( 'wireBatch' ).save();
    }.observes( 'wireBatch.type', 'wireBatch.bank_route_id', 'wireBatch.currency_id' ),

    actions: {
        goBack: function(){
            Ember.$( 'tr.active' ).removeClass( 'active' );
            return true;
        },
        sendBatch: function(){
            var self = this;
            this.validate().then(
                function(){
                    if( !self.get( 'hasError' ) ){
                        self.set( 'isLocked', true );
                        Ember.$.ajax( {
                            url: config.APP.uber_api_host + '/wireBatches/' + self.get( 'wireBatch' ).id + '/setSent',
                            type: 'post',
                            contentType: "application/json; charset=utf-8",
                        } ).then( function( response ){
                            var route = self.container.lookup( 'route:dashboard.pending-out' );
                            self.notify.success( 'Batch sent successfully.', { closeAfter: 5000 } );
                            route.refresh();
                            self.transitionToRoute( 'dashboard.pending-out' );
                        } );
                    }
                },
                function(){
                } );

        },

        holdBatch: function(){
            var promises = Ember.A();
            var self = this;
            self.set( 'isLocked', true );
            this.get( 'wireBatch.wires' ).forEach( function( wire ){
                promises.push( Ember.$.ajax( {
                        url: config.APP.uber_api_host + '/wires/' + wire.id + '/removeFromBatch',
                        type: 'post'
                    } ).then( function(){
                        wire.set( 'status', 4 );
                        wire.save();
                    } )
                );
            } );

            Ember.RSVP.Promise.all( promises ).then(
                function(){
                    self.set( 'isLocked', false );
                    self.notify.success( 'All wires in this batch have been held.', { closeAfter: 5000 } );
                },
                function( xhr ){
                    self.set( 'isLocked', false );
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                }
            );
        }
    }
} );
