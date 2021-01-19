import Ember from 'ember';

export default Ember.Component.extend( {
    classNames: [ 'invoice' ],
    session: Ember.inject.service(),

    getStringList: function(){
        this.set( 'stringList', this.get( 'localeFile.invoice-view' ) );
    }.on( 'init' ),

    amountPaid: function(){
        return this.get( 'model.transactions' ).reduce( ( acc, item )=>{
            if( item.get( 'type' ) !== 3 ){
                return acc + item.get( 'amount' );
            }
            return acc;
        }, 0 );
    }.property( 'model.transactions.@each.amount', 'model.transactions.@each.type' ),

    // amountPaid: function(){
    //     var amountPaid = 0;
    //     if( this.get( 'model.transactions' ) ){
    //         this.get( 'model.transactions' ).forEach( ( item )=>{
    //             if( item.get( 'type' ) !== 3 ){
    //                 amountPaid += item.get( 'amount' );
    //             }
    //         } );
    //     }
    //     return amountPaid;
    // }.property( 'model.transactions.@each.amount', 'model.transactions.@each.type' ),

    amountFee: function(){
        return this.get( 'model.transactions' ).reduce( ( acc, item )=>{
            if( item.get( 'type' ) === 3 ){
                return acc + item.get( 'amount' );
            }
            return acc;
        }, 0 );
    }.property( 'model.transactions.@each.amount', 'model.transactions.@each.type' ),

    sub_total: function(){
        var total = 0.00;
        this.get( 'model.invoice_items' ).forEach( function( item ){
            total += item.get( 'price' ) * item.get( 'quantity' );
        } );
        if( isNaN( total ) ){
            return 0.00;
        }
        else{
            return Math.max( total, 0 );
        }
    }.property( 'model.invoice_items.@each.price', 'model.invoice_items.@each.quantity' ),

    tax: function(){
        var tax = ( Number( this.get( 'sub_total' ) ) * ( this.get( 'model.invoice.tax_rate' ) / 100 ) );
        if( isNaN( tax ) ){
            return 0.00;
        }
        else{
            return tax;
        }
    }.property( 'sub_total', 'model.tax_rate' ),

    total: function(){
        var total = ( Number( this.get( 'sub_total' ) ) + ( Number( this.get( 'tax' ) )) );
        if( isNaN( total ) ){
            return 0.00;
        }
        else{
            return total;
        }
    }.property( 'sub_total', 'tax' ),

    actions: {
        getPdf(){
            window.open( `${this.get( 'model.invoice.urlPdf' )}?token=${this.get( 'session.data.authenticated.access_token' )}`, '_self' );
        }
    }
} );