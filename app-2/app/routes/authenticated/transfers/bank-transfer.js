import Ember from 'ember';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import DirtyCheck from 'akx-app/mixins/dirty-check';
import twoFactorCheck from 'akx-app/mixins/two-factor-check';
import bankTransferValidations from 'akx-app/validations/bank-transfer';
import lookupValidator from 'ember-changeset-validations';
import Changeset from 'ember-changeset';

export default Ember.Route.extend( AuthenticatedRouteMixin, StringObjectMixin, twoFactorCheck, DirtyCheck, {

    model(){
        return Ember.RSVP.hash( {
            accounts: this.store.findAll( 'account' ),
            templates: this.store.findAll( 'wire-template' ),
            wire: this.store.createRecord( 'wire', {
                account_id: '',
                speedwire: 0,
                type: 0,
                company_id: this.get( 'session.data.authenticated.company.id' ),
                amount: 0
            } ),
            countries: this.store.query( 'location', { type: 0, status: 1 } ),
            states: this.store.query( 'location', { type: 1, status: 1 } ),
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
        let akxUtil = this.get( 'akxUtil' );

        bankTransferValidations.amount.push(
            function( _, newValue, oldValue, changes ){
                // Checks if amount is less than balance
                let accountBalance = controller.get( 'fromAccount.balance' );
                let fee = akxUtil.getWireFee( model.fee, changes );
                return newValue > Math.round( accountBalance - fee, 2 ) ? controller.get( 'stringList.amountErrorMessage' ) : true;
            },
            function( _, newValue, oldValue, changes ){
                // Checks if wire is ach, if yes validate amount else returns true
                return changes.method === 1 && newValue > 3000 ? controller.get( 'stringList.achErrorMessage') : true
            }
        );

        let changeset = new Changeset(
            model.wire,
            lookupValidator( bankTransferValidations ),
            bankTransferValidations,
            { skipValidate: true }
        );
        let uri = 'authenticated.transfers.wire-options'
        let steps = [
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
                name: 'Template Chosen',
                template: 'transfers/index/bank-transfer/choose-template',
                title: Ember.computed( 'changeset.template_id', ()=>{
                    if( changeset.get( 'template_id' ) && changeset.get( 'template_id' ) !== 'no-template' ){
                        let temp = controller.get( 'templates' ).findBy( 'id', changeset.get( 'template_id' ) );
                        return temp.get( 'name' )
                    }
                    return controller.get( 'stringList.proceedWithout' );
                } ),
                changeset: changeset,
                validateFields: [ 'selected' ]
            },
            {
                name: 'Method',
                template: 'partials/methods',
                title: Ember.computed( 'changeset.method', ()=>{
                    if( !Ember.isEmpty( changeset.get( 'method' ) ) ){
                        if( changeset.get( 'method' ) === 0 ){
                            return `${controller.get( 'stringList.wire' )} transfer`;
                        }
                        return `${controller.get( 'stringList.ach' )} transfer`;
                    }
                    return '&nbsp;';
                } ),
                show: false,
                changeset: changeset,
                validateFields: [ 'method' ]
            },
            {
                name: 'Bank',
                template: 'partials/bank-information',
                beforeExit: controller.beforeExitBankInfo.bind( controller ),
                title: Ember.computed( 'changeset.bank_name', ()=>{
                    if( changeset.get( 'bank_name' ) ){
                        return changeset.get( 'bank_name' );
                    }
                    return '&nbsp;';
                } ),
                changeset: changeset,
                show: true,
                validateFields: [
                    'bank_name',
                    'bank_address',
                    'bank_city',
                    'bank_country',
                    'bank_state_province',
                    'bank_postal_code',
                    'bank_phone',
                    'code_aba',
                    'code_irc',
                    'code_swift'
                ]
            },
            {
                name: 'Beneficiary',
                template: 'partials/beneficiary-information',
                title: Ember.computed( 'changeset.account_holder', ()=>{
                    if( changeset.get( 'account_holder' ) ){
                        return changeset.get( 'account_holder' );
                    }
                    return '&nbsp;';
                } ),
                changeset: changeset,
                show: true,
                validateFields: [
                    'account_holder',
                    'account_holder_dob',
                    'account_holder_address',
                    'account_holder_city',
                    'account_holder_state_province',
                    'account_holder_nationality',
                    'account_holder_postal_code',
                    'account_holder_country',
                    'account_number',
                    'account_iban',
                    'purpose',
                    'beneficiary_type'
                ]
            },
            {
                name: 'Amount',
                template: 'transfers/index/amount',
                title: Ember.computed( 'changeset.amount', ()=>{
                    if( changeset.get( 'amount' ) ){
                        return controller.get( 'intl' ).formatNumber( changeset.get( 'amount' ), {
                            minimumFractionDigits: 2,
                            style: 'currency',
                            currency: controller.get( 'fromAccount.currency_id' )
                        } );
                    }
                    return '&nbsp;';
                } ),
                changeset: changeset,
                show: true,
                validateFields: [ 'amount', 'notes' ]
            },
            {
                name: 'Confirm',
                template: 'transfers/index/bank-transfer/bank-transfer-confirmation',
                title: '&nbsp;',
                show: true,
            }
        ]

        controller.setProperties( {
            changeset: changeset,
            currentStep: 1,
            isLocked: false,
            templates: model.templates,
            isBankTransfer: true,
            steps: steps
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
            var canTransition = transition.intent.name === 'authenticated.transfers.success' || transition.intent.name === 'login';
            if( canTransition || this.checkDirtyState() ){
              return true;
            }
            transition.abort();
        }
    }
} );
