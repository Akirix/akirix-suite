import Ember from 'ember';

export default Ember.Component.extend( {
    elementId: 'child-invoices',

    filterAllInvoices: function(){
        this.get( 'invoices' ).then( ()=>{
            let promises = this.get( 'invoices' ).map( ( invoice )=>{
                if( invoice.get( 'isPending' ) ){
                    return invoice;
                }
            } ).filter( ( invoice ) => {
                if( !Ember.isEmpty( invoice ) ){
                    return this.get( 'akxUtil' ).authAjax( {
                        type: 'GET'
                    }, `/invoices/${invoice.id}/can_create_child` ).then( ()=>{
                        return invoice;
                    } );
                }
            } );
            return Ember.RSVP.Promise.all( promises );
        } ).then( ( res )=>{
            if( !Ember.isEmpty( res ) ){
                let promises = res.filter( ( invoice )=>{
                    return invoice.get( 'invoice_items' );
                } );
                return Ember.RSVP.Promise.all( promises );
            }
        } ).then( ( res )=>{
            if( !Ember.isEmpty( res ) ){
                if( res.length === 1 ){
                    this.get( 'selectBill' )( res[ 0 ] );
                }
                else{
                    this.set( 'filteredInvoices', res );
                }
            }
        } ).catch( ( err )=>{
            this.sendAction( 'error', err );
        } );
    }.on( 'init' )
} );