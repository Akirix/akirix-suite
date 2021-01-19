import Ember from 'ember';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import DirtyCheck from 'akx-app/mixins/dirty-check';
import twoFactorCheck from 'akx-app/mixins/two-factor-check';
import bookTransferValidations from 'akx-app/validations/book-transfer';
import { validateNumber } from 'ember-changeset-validations/validators';
import lookupValidator from 'ember-changeset-validations';
import Changeset from 'ember-changeset';

export default Ember.Route.extend( AuthenticatedRouteMixin, StringObjectMixin, twoFactorCheck, DirtyCheck, {
    intl: Ember.inject.service(),

    model(){
        return Ember.RSVP.hash( {
            wire: this.store.createRecord( 'wire', {
                type: 2,
                method: 2,
                company_id: this.get( 'session.data.authenticated.company.id' ),
                amount: 0
            } ),
            accounts: this.store.findAll( 'account' ),
            fees: this.store.findAll( 'fee' )
        } );
    },

    afterModel( model ){
        this._super( ...arguments );
        model[ 'fee' ] = model.fees.objectAt( 0 );
        return model;
    },

    setupController( controller, model ){
        this._super( ...arguments );
        bookTransferValidations.amount = [
            validateNumber( { gt: 0, positive: true, allowBlank: false } ),
            function( _, newValue ){
                let accountBalance = controller.get( 'fromAccount.balance' );
                let fee = newValue * Number( model.fee.get( 'fee_book_transfer' ) );
                return newValue > ( accountBalance - fee ).toFixed( 2 ) ? 'Amount must be less than or equal to available amount' : true;
            }
        ];

        let changeset = new Changeset(
            model.wire,
            lookupValidator( bookTransferValidations ),
            bookTransferValidations
        );
        let uri = 'authenticated.transfers.wire-options'
        controller.setProperties( {
            changeset: changeset,
            currentStep: 1,
            steps: [
                {
                    name: 'Transfer Method',
                    link: uri,
                    title: controller.get( 'stringList.transfer' ),
                    transitionToUri: this.checkDirtyState.bind( this )
                },
                {
                    name: 'Transferring From',
                    beforeExit: controller.beforeExitAccount.bind( controller ),
                    template: 'transfers/index/account-selection',
                    title: Ember.computed( 'changeset.account_id', ()=>{
                        if( changeset.get( 'account_id' ) ){
                            let account = model.accounts.findBy( 'id', changeset.get( 'account_id' ) );
                            return account.get( 'name' );
                        }
                        return '&nbsp;';
                    } ),
                    changeset: changeset,
                    validateFields: [ 'account_id' ]
                },
                {
                    name: 'Transfer destination',
                    template: 'transfers/index/book-transfer/choose-company',
                    title: Ember.computed( 'changeset.account_number', ()=>{
                        if( changeset.get( 'account_number' ) ){
                            return `XYZ${changeset.get( 'account_number' )}`
                        }
                        return '&nbsp;';
                    } ),
                    changeset: changeset,
                    show: true,
                    validateFields: [ 'account_number' ]
                },
                {
                    name: 'Amount',
                    template: 'transfers/index/amount',
                    title: Ember.computed( 'changeset.amount', ()=>{
                        if( changeset.get( 'amount' ) ){
                            return this.get( 'intl' ).formatNumber( changeset.get( 'amount' ), {
                                minimumFractionDigits: 2,
                                style: 'currency',
                                currency: controller.fromAccount.get( 'currency_id' )
                            } );
                        }
                        return '&nbsp;';
                    } ),
                    changeset: changeset,
                    show: true,
                    validateFields: [ 'amount', 'notes' ]
                },
                {
                    name: 'Confirm Details',
                    template: 'transfers/index/book-transfer/book-transfer-confirmation',
                    show: true,
                    title: '&nbsp;'
                }
            ]
        } );
    },
    
    renderTemplate(){
        this.render( 'transfers/index/init-steps', {
            into: 'authenticated'
        } );
    },

    checkDirtyState( step ){
        let controller = this.controllerFor( this.routeName );
        let changeset = controller.get( 'changeset' );
        let wire = controller.get( 'model.wire' );

        if( changeset.get( 'isDirty' ) || ( !wire.get( 'isDeleted' ) && wire.get( 'isNew' ) ) ){
            let response = confirm( 'You have unsaved changes that will be lost. Are you sure you want to navigate away from this page?' );
            if( response ){
                if( step ){
                    controller.transitionToUri( step );
                }
                else {
                    controller.send( 'deleteModel' );
                }
            }
            return response;
        }
        return true;
    },

    actions: {
        willTransition( transition ){
            if( this.checkDirtyState() ){
                return true;
            }
            transition.abort();
        }
    }
} );
