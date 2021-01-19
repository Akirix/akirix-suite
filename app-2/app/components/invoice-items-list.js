import Ember from 'ember';

export default Ember.Component.extend( {
    store: Ember.inject.service(),
    classNames: [ 'invoice-items-list' ],
    name: 'invoice-items-list',

    getStringList: function(){
        this.set( 'stringList', this.get( 'localeFile.invoice-items-list' ) );
        if( Ember.isEmpty( this.get( 'changeset.invoiceItems' ) ) ){
            this.send( 'addInvoiceItem' );
            // Prevent validation on init
            this.set( 'validate', true );
        }
    }.on( 'init' ),

    invoiceItemsCheck: function(){
        this.set( 'hasError', false );
        if( !Ember.isEmpty( this.get( 'changeset.invoiceItems' ) ) && this.get( 'validate' ) ){
            let stringList = this.get( 'stringList' );
            this.get( 'changeset.invoiceItems' ).forEach( ( item )=>{
                item.set( 'error', {} );

                if( Ember.isEmpty( item.get( 'name' ) ) ){
                    this.set( 'hasError', true );
                    item.set( 'error.name', [ stringList[ 'nameError' ] ] );
                }

                if( Ember.isEmpty( item.get( 'price' ) ) || isNaN( Number( item.get( 'price' ) ) ) ){
                    this.set( 'hasError', true );
                    item.set( 'error.price', [ stringList[ 'priceError' ]  ] );
                }

                if( Ember.isEmpty( item.get( 'quantity' ) ) || isNaN( Number( item.get( 'quantity' ) ) ) || Number( item.get( 'quantity' ) ) < 0.00 ){
                    this.set( 'hasError', true );
                    item.set( 'error.quantity', [ stringList[ 'quantityError' ] ] );
                }

            } );
        }
    }.observes( 'changeset.invoiceItems.@each.name','changeset.invoiceItems.@each.price', 'changeset.invoiceItems.@each.quantity' ),

    setTotal: function(){
        if( !Ember.isEmpty( this.get( 'changeset.invoiceItems' ) ) ){
            this.set( 'changeset.amount', this.get( 'total' ) );
        }
    }.observes( 'total' ),

    sub_total: function(){
        var total = 0.00;
        this.get( 'changeset.invoiceItems' ).forEach( function( item ){
            total += item.get( 'price' ) * item.get( 'quantity' );
        } );
        if( isNaN( total ) ){
            return 0.00;
        }
        else{
            return Math.max( total, 0 );
        }
    }.property( 'changeset.invoiceItems.@each.price', 'changeset.invoiceItems.@each.quantity' ),

    tax: function(){
        var tax = ( Number( this.get( 'sub_total' ) ) * ( this.get( 'changeset.tax_rate' ) / 100 ) );
        if( isNaN( tax ) ){
            return 0.00;
        }
        else{
            return tax;
        }
    }.property( 'sub_total', 'changeset.tax_rate' ),

    total: function(){
        var total = ( Number( this.get( 'sub_total' ) ) + ( Number( this.get( 'tax' ) ) ) );
        if( isNaN( total ) ){
            return 0.00;
        }
        else{
            return total;
        }
    }.property( 'sub_total', 'tax' ),

    actions: {
        addInvoiceItem(){
            let newItem = this.get( 'store' ).createRecord( 'invoice-item', {
                name: null,
                unit: '--',
                price: null,
                quantity: null,
                invoice_id: this.get( 'changeset.id' )
            } );
            this.get( 'changeset.invoiceItems' ).pushObject( newItem );
        },

        deleteInvoiceItem( item ){
            if( item.get( 'isNew' ) ){
                item.deleteRecord();

            }
            else{
                item.destroyRecord();
            }
            this.get( 'changeset.invoiceItems' ).removeObject( item );
        }
    }
} );