import Ember from 'ember';

export default Ember.Component.extend( {
    getStringList: function(){
        this.set( 'stringList', this.get( 'localeFile.pay-invoice' ) );
    }.on( 'init' ),

    amountPaid: function(){
        var amountPaid = 0;
        if( !Ember.isEmpty( this.get( 'invoice.transactions' ) ) ){
            this.get( 'invoice.transactions' ).forEach( function( item ){
                if( item.get( 'isNotFee' ) ){
                    amountPaid += item.get( 'amount' );
                }
            } );
        }
        return amountPaid;
    }.property( 'invoice.transactions.@each.amount' ),

    amountRemain: function(){
        return Number( this.get( 'invoice.total' ) ) - Number( this.get( 'amountPaid' ) );
    }.property( 'amountPaid', 'invoice.total' ),

    pointsTakenOut: function(){
        let fee = this.get( 'fee.fee_invoice_out' );
        let amount = this.get('changeset.amount');

        let points = this.get( 'node.points_available' );
        let totalAmount = ( amount + ( amount * fee ) ).toFixed( 2 );

        if( totalAmount > points ){
            // money taken out of balance 
            this.set( 'outOfBalance', ( totalAmount - points ).toFixed( 2 ) );
            this.set( 'outOfPoints', points );
        }
        else if( totalAmount === points ){
            this.set( 'outOfBalance', 0 );
            this.set( 'outOfPoints', ( points + ( amount * fee ) ).toFixed( 2 ) );
        }
        else{
            this.set( 'outOfBalance', 0 );
            this.set( 'outOfPoints', totalAmount );
        }
    }.property( 'changeset.amount', 'node.points_available', 'invoice.remaining_amount' ),

    actions: {
        chooseAccount(){
            this.set( 'account', this.get( 'accounts' ).findBy( 'id', this.get( 'changeset.account_id' ) ) );
        }
    }
} );