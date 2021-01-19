import Ember from 'ember';
import AkxUtil from 'uber-app/utils/akx-util';
import config from 'uber-app/config/environment';

var locale = new Globalize( navigator.language );


export default Ember.Component.extend( {
    store: Ember.inject.service(),

    isWire: function(){
        return this.get( 'transaction.type' ) === 'Wire';
    }.property( 'transaction.type' ),

    str_created_at: function(){
        return moment( this.get( 'transaction.date' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'transaction.date' ),

    str_amount: function(){
        return locale.format( Number( this.get( 'transaction.amount' ) ), 'n2' );
    }.property( 'transaction.amount' ),

    base_str_amount: function(){
        return locale.format( Number( this.get( 'transaction.base_amount' ) ), 'n2' );
    }.property( 'transaction.base_amount' ),

    counter_str_amount: function(){
        return locale.format( Number( this.get( 'transaction.counter_amount' ) ), 'n2' );
    }.property( 'transaction.counter_amount' ),

    init: function(){
        this._super();
    },

} );