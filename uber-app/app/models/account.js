import Ember from 'ember';
import DS from 'ember-data';
import _ from 'lodash/lodash';
var locale = new Globalize( navigator.language );

export default DS.Model.extend( {
    company_id: DS.attr(),
    currency_id: DS.attr(),
    fund_id: DS.attr(),

    name: DS.attr(),
    balance: DS.attr(),
    balance_hold: DS.attr(),
    points_in: DS.attr(),
    points_out: DS.attr(),
    points_out_cash: DS.attr(),
    pending_in: DS.attr(),
    pending_out: DS.attr(),
    type: DS.attr(),

    company: DS.belongsTo( 'company', { async: true } ),
    currency: DS.belongsTo( 'currency', { async: true } ),
    fund: DS.belongsTo( 'fund', { async: true } ),

    balance_total: function(){
        return Number( this.get( 'balance' ) ) + Number( this.get( 'balance_hold' ) ) + Number( this.get( 'points_out_cash' ) ) + Number( this.get( 'pending_out' ) );
    }.property( 'balance', 'points_out_cash', 'pending_out' ),

    str_balance: function(){
        return locale.format( Number( this.get( 'balance' ) ), 'n2' );
    }.property( 'balance' ),

    str_balance_hold: function(){
        return locale.format( Number( this.get( 'balance_hold' ) ), 'n2' );
    }.property( 'balance_hold' ),

    str_balance_total: function(){
        return locale.format( Number( this.get( 'balance_total' ) ), 'n2' );
    }.property( 'balance_total' ),

    str_points_in: function(){
        return locale.format( Number( this.get( 'points_in' ) ), 'n2' );
    }.property( 'points_in' ),

    str_points_out: function(){
        return locale.format( Number( this.get( 'points_out_cash' ) ), 'n2' );
    }.property( 'points_out' ),

    str_pending_in: function(){
        return locale.format( Number( this.get( 'pending_in' ) ), 'n2' );
    }.property( 'pending_in' ),

    str_pending_out: function(){
        return locale.format( Number( this.get( 'pending_out' ) ), 'n2' );
    }.property( 'pending_out' ),

    str_long_name: function(){
        return Ember.String.htmlSafe( this.get( 'name' ) + ': ' + this.get( 'currency.symbol' ) + this.get( 'str_balance' ) );
    }.property( 'name', 'currency.symbol', 'str_balance' )

} );

