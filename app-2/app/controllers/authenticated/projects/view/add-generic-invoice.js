import Ember from 'ember';
import projectAnimation from 'akx-app/mixins/project-animation';

export default Ember.Controller.extend( projectAnimation, {

    saveInvoice(){
        let changeset = this.get( 'changeset' );

        return changeset.validate().then( ()=>{
            if( changeset.get( 'isValid' ) ){
                return changeset.save();
            }
            return changeset.get( 'isValid' );
        } ).then( ( isValid )=>{
            this.set( 'isLocked', false );
            if( isValid ){
                let promises = Ember.A();
                changeset.get( 'invoiceItems' ).forEach( ( item )=>{
                    item.set( 'invoice_id', changeset.get( 'id' ) );
                    promises.push( item.save() );
                } );
                return Ember.RSVP.Promise.all( promises );
            }
            return isValid;
        } ).catch( ( err )=>{
            this.set( 'isLocked', false );
            this.send( 'error', err );
        } );
    },

    actions: {
        cancel(){
            this.send( 'closeSidePanel' );
        },
        confirm(){
            let changeset = this.get( 'changeset' );
            changeset.set( 'account_id', this.get( ' model.node.account_id' ) );

            this.saveInvoice().then( ()=>{
                if( changeset.get( 'isValid' ) ){
                    this.set( 'model.invoice_items', this.get( 'changeset.invoiceItems' ) );
                    this.send(
                        'openSidePanel',
                        'projects/view/confirm-view',
                        'projects/view/side-navs/confirm-invoice',
                        this
                    );
                }
            } );
        },
        edit(){
            this.send( 'openSidePanel', 'projects/view/add-invoice', '', this );
        },
        sendInvoice(){
            this.get( 'akxUtil' ).authAjax( {
                type: 'post'
            }, `/invoices/${this.get( 'changeset.id' )}/activate` ).then( ( isValid )=>{
                if( isValid ){
                    this.setProperties( {
                        isLocked: false,
                        success: true,
                        message: this.get( 'stringList.successMessageSent')
                    } );
                }
            } ).catch( ( err )=>{
                this.set( 'isLocked', false );
                if( err instanceof Ember.Error ){
                    this.send( 'error', err );
                }
                else{
                    this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
                }
            } );
        },
        saveInvoice(){
            this.saveInvoice().then( ( isValid )=>{
                this.set( 'isLocked', false );
                if( isValid ){
                    this.set( 'success', true );
                    this.set( 'message', this.get( 'stringList.successMessageSent') );
                }
            } ).catch( ( err )=>{
                this.set( 'isLocked', false );
                this.send( 'error', err );
            } );
        }
    }
} );
