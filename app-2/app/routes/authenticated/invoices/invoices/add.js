import Ember from 'ember';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import DirtyCheck from 'akx-app/mixins/dirty-check';
import lookupValidator from 'ember-changeset-validations';
import invoiceValidations from 'akx-app/validations/invoice';
import Changeset from 'ember-changeset';

export default Ember.Route.extend( AuthenticatedRouteMixin, StringObjectMixin, DirtyCheck, {

    model(){
        return Ember.RSVP.hash( {
            accounts: this.store.findAll( 'account' ),
            countries: this.store.query( 'location', { type: 0, status: 1 } ),
            states: this.store.query( 'location', { type: 1, status: 1 } ),
            fromCompany: this.get( 'session.data.authenticated.company' ),
            invoice: this.store.createRecord( 'invoice', {
                account_id: '',
                type: null,
                account_number: '',
                notes: '',
                title: '',
                tax_rate: 0,
                amount: 0,
                documents: Ember.A(),
                invoiceItems: Ember.A(),
                company_id: this.get( 'session.data.authenticated.company.id' )
            } )
        } );
    },

    setupController( controller, model ){
        this._super( ...arguments );
        let stringList = controller.get( 'stringList' );
        let changeset = new Changeset(
            model.invoice,
            lookupValidator( invoiceValidations ),
            invoiceValidations,
            { skipValidate: true }
        );
        controller.setProperties( {
            accounts: model.accounts,
            currentStep: 0,
            changeset: changeset,
            isLocked: false,
            steps: [
                {
                    name: 'Invoice Type',
                    template: 'invoices/type-selection',
                    beforeExit: controller.beforeExitType.bind(controller),
                    title: Ember.computed( 'changeset.type', ()=>{
                        if( changeset.get( 'type' ) ){
                            return changeset.get( 'type' ) ? stringList.onPlatform : stringList.offPlatform
                        }
                    } ),
                    show: false,
                    changeset: changeset,
                    validateFields: [ 'type' ]
                },
                {
                    name: 'Account',
                    beforeExit: controller.beforeExitAccounts.bind( controller ),
                    template: 'invoices/account-selection',
                    title: Ember.computed( 'changeset.account_id', ()=>{
                        if( changeset.get( 'account_id' ) ){
                            let account = controller.get( 'accounts' ).findBy(
                                'id',
                                changeset.get( 'account_id' )
                            );
                            return account.get( 'name' )
                        }
                        return '&nbsp;';
                    } ),
                    show: false,
                    changeset: changeset,
                    validateFields: [ 'account_id' ]
                },
                {
                    name: 'Company',
                    beforeExit: controller.beforeExitCompany.bind( controller ),
                    template: 'invoices/company',
                    title: Ember.computed( 'changeset.account_number', ()=>{
                        if( changeset.get( 'account_number' ) ){
                            return `XYZ ${changeset.get( 'account_number' )}`
                        }
                        return '&nbsp;';
                    } ),
                    show: true,
                    changeset: changeset,
                    validateFields: [ 'account_number' ]
                },
                {
                    name: 'Invoice Details',
                    beforeExit: controller.beforeExitDetails.bind( controller ),
                    template: 'invoices/invoice-details',
                    title: Ember.computed( 'changeset.title', ()=>{
                        if( changeset.get( 'title' ) ){
                            return changeset.get( 'title' );
                        }
                        return '&nbsp;';
                    } ),
                    changeset: changeset,
                    show: true,
                    validateFields: [ 'title', 'invoice_items', 'amount' ]
                },
                {
                    name: 'Confirm Details',
                    template: 'invoices/confirmation',
                    show: true,
                    title: '&nbsp;'
                }
            ]
        } );
    },

    renderTemplate(){
        this.render( 'invoices/add', {
            into: 'authenticated'
        } );
    },

    checkDirtyState( controller ){
        let changeset = controller.get( 'changeset' );
        let invoice = controller.get( 'model.invoice' );

        if( changeset.get( 'isDirty' ) || ( !invoice.get( 'isDeleted' ) && invoice.get( 'isNew' ) ) ){
            let response = confirm( 'You have unsaved changes that will be lost. Are you sure you want to navigate away from this page?' );
            if( response ){
                controller.send( 'deleteModel' );
            }
            return response;
        }
        return true;
    },

    actions: {
        willTransition( transition ){
            let controller = this.controllerFor( this.routeName );
            if( this.checkDirtyState( controller ) ){
                return true;
            }
            transition.abort();
        }
    }
} );
