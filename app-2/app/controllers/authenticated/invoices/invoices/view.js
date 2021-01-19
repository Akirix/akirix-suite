import Ember from 'ember';

export default Ember.Controller.extend( {
    session: Ember.inject.service( 'session' ),

    actions: {
        recallInvoice(){
            this.get( 'akxUtil' ).authAjax( {
                type: 'post'
            }, `/invoices/${this.get( 'model.invoice.id' )}/recall` ).then( ()=>{
                this.get( 'model.invoice' ).reload();
                this.send( 'closeSidePanel' );
            } ).catch( ( err )=>{
                this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
            } );
        },
        markPaidInvoice(){
            this.get( 'akxUtil' ).authAjax( {
                type: 'post'
            }, `/invoices/${this.get( 'model.invoice.id' )}/markPaid`).then( ()=>{
                this.get( 'model.invoice' ).reload();
                this.send( 'closeSidePanel' );
            } ).catch( ( err )=>{
                this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
            } );
        }
    }
} );