import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import DirtyCheck from 'akx-app/mixins/dirty-check';
import twoFactorCheck from 'akx-app/mixins/two-factor-check';
import lookupValidator from 'ember-changeset-validations';
import accountTransferValidations from 'akx-app/validations/account-transfers';
import { validateNumber } from 'ember-changeset-validations/validators';
import Changeset from 'ember-changeset';

export default Ember.Route.extend( StringObjectMixin, twoFactorCheck, DirtyCheck, {
    intl: Ember.inject.service(),

    model(){
        return Ember.RSVP.hash( {
            modelCreating: {
                account_id: '',
                amount: 0,
                notes: ''
            },
            accounts: this.store.findAll( 'account' )
        } );
    },

    setupController( controller, model ){
        this._super( ...arguments );
        accountTransferValidations.amount = [
            validateNumber( { gt: 0, positive: true, allowBlank: false } ),
            function( _, newValue ){
                return newValue > controller.get( 'fromAccount.balance' ) ? controller.get( 'stringList.amountErrorMessage' ) : true;
            }
        ];

        let changeset = new Changeset(
            model.modelCreating,
            lookupValidator( accountTransferValidations ),
            accountTransferValidations
        );
        let uri = 'authenticated.transfers.wire-options'
        controller.setProperties( {
            changeset: changeset,
            isLocked: false,
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
                    template: 'transfers/index/account-transfer/from-account-selection',
                    title: Ember.computed( 'changeset.from_account_id', ()=>{
                        if( changeset.get( 'from_account_id' ) ){
                            let account = model.accounts.findBy( 'id', changeset.get( 'from_account_id' ) );
                            return account.get( 'name' );
                        }
                        return '&nbsp;';
                    } ),
                    changeset: changeset,
                    validateFields: [ 'from_account_id' ]
                },
                {
                    name: 'Transfer destination',
                    template: 'transfers/index/account-transfer/to-account-selection',
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
                    validateFields: [ 'amount' ]
                },
                {
                    name: 'Confirm Details',
                    template: 'transfers/index/account-transfer/account-transfer-confirmation',
                    title: '&nbsp;',
                    show: true,
                }
            ]
        } );
    },
    
    renderTemplate(){
        this.render( 'transfers/index/init-steps', {
            into: 'authenticated'
        } );
    },


    checkDirtyState( controller ){
        let changeset = controller.get( 'changeset' );

        if( changeset.get( 'isDirty' ) ){
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
