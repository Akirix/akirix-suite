import Ember from 'ember';
import DS from 'ember-data';
var locale = new Globalize( navigator.language );

export default DS.Model.extend( {

    account_id: DS.attr(),
    company_id: DS.attr(),
    amount: DS.attr( 'number' ),
    currency_id: DS.attr(),
    type: DS.attr( 'number' ),
    status: DS.attr( 'number' ),
    start_date: DS.attr( 'date' ),
    title: DS.attr(),
    notes: DS.attr(),
    frequency: DS.attr( 'number' ),
    frequency_type: DS.attr(),
    next_payment_date: DS.attr( 'date' ),
    fee_counter: DS.attr( 'number' ),
    created_at: DS.attr(),
    updated_at: DS.attr(),

    currency: DS.belongsTo( 'currency', { async: true } ),
    account: DS.belongsTo( 'account', { async: true } ),

    canCancel: function(){
        return this.get( 'status' ) !== 2;
    }.property( 'status' ),

    str_created_at_date: function(){
        return moment( this.get( 'created_at' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'created_at' ),

    str_next_payment_date: function(){
        return moment( this.get( 'next_payment_date' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'created_at' ),

    str_start_date: function(){
        return moment( this.get( 'start_date' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'created_at' ),

    str_amount: function(){
        return locale.format( Number( this.get( 'amount' ) ), 'n2' );
    }.property( 'amount' ),

    str_fee_counter: function(){
        return locale.format( Number( this.get( 'fee_counter' ) ), 'n2' );
    }.property( 'fee_counter' ),

    isOneTime: function(){
        return ( this.get( 'type' ) === 0 );
    }.property( 'type' )
} );

