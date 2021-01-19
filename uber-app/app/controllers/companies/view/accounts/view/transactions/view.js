import Ember from 'ember';
var locale = new Globalize( navigator.language );

export default Ember.Controller.extend( {
    needs: [ 'application' ],
    transaction: null,
    paneSecondary: 'companies/accounts/help-view',
    sortProperties: [ 'created_at' ],
    sortAscending: false,

    // Invoice stuff:
    amount_paid: function(){
        var amountPaid = 0;
        if( this.get( 'model.invoice_transactions' ) !== undefined ){
            this.get( 'model.invoice_transactions' ).forEach( function( item ){
                if( item.get( 'type' ) !== 3 ){
                    amountPaid += item.get( 'amount' );
                }
            } );
        }
        return amountPaid;
    }.property( 'model.invoice_transactions.@each.amount', 'model.invoice_transactions.@each.type' ),

    amount_fee: function(){
        var amountFee = 0;
        if( this.get( 'model.invoice_transactions' ) !== undefined ){
            this.get( 'model.invoice_transactions' ).forEach( function( item ){
                if( item.get( 'type' ) === 3 ){
                    amountFee += item.get( 'amount' );
                }
            } );
        }
        return amountFee;
    }.property( 'model.invoice_transactions.@each.amount', 'model.invoice_transactions.@each.type' ),

    amount_remain: function(){
        return Number( this.get( 'model.invoice.total' ) ) - Number( this.get( 'amount_paid' ) );
    }.property( 'amount_paid', 'model.invoice.total' ),

    str_amount_paid: function(){
        return locale.format( Number( this.get( 'amount_paid' ) ), 'n2' );
    }.property( 'amount_paid' ),

    str_amount_remain: function(){
        return locale.format( Number( this.get( 'amount_remain' ) ), 'n2' );
    }.property( 'amount_remain' ),

    str_amount_fee: function(){
        return locale.format( Number( this.get( 'amount_fee' ) ), 'n2' );
    }.property( 'amount_fee' ),

    actions: {
    }
} );

