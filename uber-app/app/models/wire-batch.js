import DS from 'ember-data';
import _ from 'lodash/lodash';

var locale = new Globalize( navigator.language );

export default DS.Model.extend( {
    scheduled_time: DS.attr(),
    currency_id: DS.attr(),
    amount: DS.attr(),
    type: DS.attr(),
    status: DS.attr(),
    wires: DS.hasMany( 'wire', { async: true } ),
    bank_route_id: DS.attr(),
    bankRoute: DS.belongsTo( 'bank-route', { async: true } ),
    currency: DS.belongsTo( 'currency', { async: true } ),

    batch_total: function(){
        var totalAmount = 0;
        this.get( 'wires' ).forEach( function( wire ){
            totalAmount += wire.get( 'amount' );
        } );
        return locale.format( Number( totalAmount ), 'n2' );
    }.property( 'wires.@each.amount' ),

    str_scheduled_date: function(){
        return moment( this.get( 'scheduled_time' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'scheduled_time' ),

    str_scheduled_time: function(){
        return moment( this.get( 'scheduled_time' ) ).utc().format( 'HH:mm:ss' );
    }.property( 'scheduled_time' ),

    str_type: function(){
        switch( this.get( 'type' ) ){
            case 0:
                return 'Regular';
            case 1:
                return 'Institution';
            case 2:
                return 'SpeedWires';
            case 3:
                return 'ACH';
            default:
                return '';
        }
    }.property( 'type' ),

    isSpeedWire: function(){
        return this.get( 'type' ) === 2;
    }.property( 'type' ),

    isSent: function(){
        return this.get( 'status' ) === 1;
    }.property( 'status' ),

    isEmptyBatch: function(){
        return this.get( 'wires.length' ) === 0;
    }.property( 'wires' ),

    batchCurrencies: function(){
        var self = this;
        var currencyArray = [];
        self.get( 'wires' ).forEach( function( wire ){
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

        return currencyArray;
    }.property( 'wires.@each.currency_id', 'wires.@each.amount' )
} );
