import Ember from 'ember';
import projectAnimation from 'akx-app/mixins/project-animation';
import lookupValidator from 'ember-changeset-validations';
import validations from 'akx-app/validations/project-invoices';
import Changeset from 'ember-changeset';

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
        },
        selectBill( snodeInvoice ){
            const model = this.get( 'model' );
            let newInvoice = this.store.createRecord( 'invoice', {
                project_id: model.project.get( 'id' ),
                currency_id: model.project.get( 'currency_id' ),
                node_id: model.node.get( 'id' ),
                documents: Ember.A(),
                parent_id: snodeInvoice.get( 'id' ),
                amount: 0.00,
                tax_rate: 0.00,
                type: 0
            } );

            if( model.project.get( 'isSmart' ) ){
                newInvoice.set( 'tax_rate', snodeInvoice.get( 'tax_rate' ) );
                newInvoice.set( 'invoice_period_from', snodeInvoice.get( 'invoice_period_from' ) );
                newInvoice.set( 'invoice_period_to', snodeInvoice.get( 'invoice_period_to' ) );
            }
            let changeset = new Changeset(
                newInvoice,
                lookupValidator( validations ),
                validations,
                { skipValidate: true }
            );

            changeset.save().then( ()=>{
                changeset.set( 'invoiceItems', this.get( 'akxUtil' ).formatEmberWay( changeset.get( 'invoiceItems' ), 'invoice-item' ) );
                this.set( 'changeset', changeset );
                this.set( 'model.invoice', newInvoice );
                this.send( 'edit' );
            } );
        }
    }
} );
