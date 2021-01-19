import Ember from 'ember';
import config from 'uber-app/config/environment';
export default Ember.Handlebars.makeBoundHelper( function( transaction, symbol ){
    var icon;
    var currency = transaction.get( 'currency' );
    if( transaction.get( 'isDebit' ) ){
        icon = '<span class="text-rose">- </span>';
    }
    else{
        icon = '<span class="text-green">+ </span>';
    }
    return new Ember.Handlebars.SafeString( icon + symbol + transaction.get( 'str_amount' ) );
} );