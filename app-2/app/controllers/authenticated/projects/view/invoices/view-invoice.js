import Ember from 'ember';

export default Ember.Controller.extend( {
    session: Ember.inject.service( 'session' ),
    actions: {
        close(){
            Ember.$( '.card.active' ).removeClass( 'active' ).parent().removeClass( 'hover' );
            Ember.$( '.hide-stuff' ).removeClass( 'show' );
            Ember.$( '.map' ).css( {
                top:'90px',
                left:0
            } );
            this.transitionToRoute( 'authenticated.projects.view' );
            this.send( 'closeSidePanel', true );
        },
        recallInvoice(){
            let invoice = this.get( 'model.invoice' );
            this.get( 'akxUtil' ).authAjax( {
                type: 'post'
            }, `/invoices/${invoice.id}/recall` ).then( ()=>{
                invoice.reload();
                this.send( 'close' );
            } ).catch( ( err )=>{
                this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
            } );
        },
        markPaidInvoice(){
            let invoice = this.get( 'model.invoice' );
            this.get( 'akxUtil' ).authAjax( {
                type: 'post'
            }, `/invoices/${invoice.id}/markPaid` ).then( ()=>{
                invoice.reload();
                this.send( 'close' );
            } ).catch( ( err )=>{
                this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
            } );
        },
        deleteModel(){
            let invoice = this.get( 'model.invoice' );
            let promises = Ember.A();

            invoice.get( 'invoice_items' ).forEach( function( item ){
                promises.push( item.destroyRecord() );
            } );

            if( !Ember.isEmpty( invoice.get( 'documents' ) ) ){
                invoice.get( 'documents' ).forEach( function( item ){
                    promises.push( item.destroyRecord() );
                } );
            }

            promises.push( invoice.destroyRecord() );
            
            Ember.RSVP.Promise.all( promises ).then( ()=>{
                this.send( 'close' );
            } ).catch( ( err )=>{
                this.send( 'error', err );
            } );
        },
        getPdf(){
            window.open(
                `${this.get( 'model.invoice.urlPdf' )}?token=${this.get( 'session.data.authenticated.access_token' )}`,
                '_self'
            );
        }
    }
} );