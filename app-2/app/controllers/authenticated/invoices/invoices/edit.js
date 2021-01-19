import Ember from 'ember';

export default Ember.Controller.extend( {
    toCompanyIsUs: function(){
        return this.get( 'changeset.to_company_country' ) === 'US';
    }.property( 'changeset.to_company_country' ),

    saveInvoice( changeset ){
        let promises = Ember.A();
        changeset.get( 'invoiceItems' ).forEach( ( item )=>{
            promises.push( item.save() );
        } );
        promises.push( changeset.save() );
        return Ember.RSVP.Promise.all( promises );
    },

    transitionToSuccess(){
        this.set( 'model.invoice_items', this.get( 'changeset.invoiceItems' ) );
        this.send( 'openSidePanel', 'invoices/side-panel-success', '', this );
    },

    validateChangeset( changeset ){
        return changeset.validate().then( ()=>{
            return changeset.get( 'isValid' );
        } );
    },

    actions: {
        sendInvoice(){
            let changeset = this.get( 'changeset' );
            this.validateChangeset( changeset ).then( ( isValid )=>{
                // Save invoice and invoice-items
                if( isValid ){
                    return this.saveInvoice( changeset );
                }
                return isValid;
            } ).then( ( isValid )=>{
                // Activate Invoice
                if( isValid ){
                    return this.get( 'akxUtil' ).authAjax( {
                        type: 'post'
                    }, `/invoices/${changeset.get( 'id' )}/activate` );
                }
                return isValid;
            } ).then( ( isValid )=>{
                // Transition to success Page
                this.set( 'isLocked', false );
                if( isValid ){
                    this.set( 'message', this.get( 'stringList.invoiceSent' ) );
                    this.transitionToSuccess();
                }
            } ).catch( ( err )=>{
                this.set( 'isLocked', false );
                this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
            } );
        },

        saveModel(){
            let changeset = this.get( 'changeset' );
            this.validateChangeset( changeset ).then( ( isValid )=>{
                // Save invoice
                if( isValid ){
                    return this.saveInvoice( changeset );
                }
                // return isValid;
            } ).then( ( isValid )=>{
                // Transition to success Page
                if( isValid ){
                    this.set( 'message', this.get( 'stringList.invoiceSaved' ) ); // MESSAGE FIRST  
                    this.transitionToSuccess(); // SHOW CHECK MARK AFTER
                }
            } ).catch( ( err )=>{
                this.set( 'isLocked', false );
                this.send( 'error', err );
            } );
        },

        deleteModel(){
            let promises = Ember.A();
            let changeset = this.get( 'changeset' );
            changeset.get( 'invoiceItems' ).forEach( ( item )=>{
                promises.push( item.destroyRecord() );
            } );
            if( !Ember.isEmpty( changeset.get( 'documents' ) ) ){
                changeset.get( 'documents' ).forEach( ( item )=>{
                    promises.push( item.destroyRecord() );
                } );
            }
            Ember.RSVP.Promise.all( promises ).then( ()=>{
                return this.get( 'model.invoice' ).destroyRecord();
            } ).then( ()=>{
                this.send( 'closeSidePanel' );
            } ).catch( ( err )=>{
                this.send( 'error', err );
            } );
        }
    }
} );