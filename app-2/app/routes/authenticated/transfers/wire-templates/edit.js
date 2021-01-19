import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import DirtyCheck from 'akx-app/mixins/dirty-check';
import lookupValidator from 'ember-changeset-validations';
import Changeset from 'ember-changeset';
import templateValidations from 'akx-app/validations/wire-templates'

export default Ember.Route.extend( StringObjectMixin, DirtyCheck, {
    model( params ){
        return Ember.RSVP.hash( {
            wireTemplate: this.store.findRecord( 'wire-template', params.wire_template_id ),
            countries: this.store.query( 'location', { type: 0, status: 1 } ),
            states: this.store.query( 'location', { type: 1, status: 1 } )
        } );
    },

    setupController( controller, model ){
        this._super( ...arguments );
        let changeset = new Changeset(
            model.wireTemplate,
            lookupValidator( templateValidations ),
            templateValidations, { skipValidate: true }
        );
        changeset.set( 'use_intermediary_bank', !!changeset.get( 'intermediary_bank_name' ) );

        let steps = [
            {
                name: 'Method',
                template: 'partials/methods',
                title: Ember.computed( 'changeset.method', ()=>{
                    let type = changeset.get( 'method' ) === 0 ? controller.get( 'stringList.wire' ) : controller.get( 'stringList.ach' );
                    return `${type} transfer`
                } ),
                changeset: changeset,
                validateFields: [ 'method' ]
            },
            {
                name: 'Bank Information',
                template: 'partials/bank-information',
                secondTemplate: 'partials/bank-id',
                beforeExit: controller.beforeExitBankInfo.bind( controller ),
                title: Ember.computed( 'changeset.bank_name', ()=>{
                    return changeset.get( 'bank_name' );
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
                    'code_swift',
                    'method'
                ]
            },
            {
                name: 'Beneficiary Information',
                template: 'partials/beneficiary-information',
                title: Ember.computed( 'changeset.account_holder', ()=>{
                    return changeset.get( 'account_holder' );
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
                name: 'Template Name',
                template: 'transfers/index/template-name',
                title: Ember.computed( 'changeset.name', ()=>{
                    return changeset.get( 'name' );
                } ),
                changeset: changeset,
                show: true,
                validateFields: [ 'name', 'notes' ]
            },
            {
                name: 'Confirm Details',
                template: 'partials/view-changeset-template',
                title: '&nbsp;',
                show: true,
            }
        ];

        if( changeset.use_intermediary_bank ){
            steps.splice( 2, 0, {
                name: 'Intermediary Bank Information',
                template: 'partials/intermediary-bank-information',
                title: Ember.computed( 'changeset.intermediary_bank_name', ()=>{
                    if( changeset.get( 'intermediary_bank_name' ) ){
                        return changeset.get( 'intermediary_bank_name' );
                    }
                    return '&nbsp;';
                } ),
                changeset: changeset,
                show: true,
                validateFields: [
                    'intermediary_bank_name',
                    'intermediary_bank_address',
                    'intermediary_bank_city',
                    'intermediary_bank_country',
                    'intermediary_bank_state_province',
                    'intermediary_bank_postal_code',
                    'intermediary_bank_code_aba',
                    'intermediary_bank_code_swift',
                    'intermediary_bank_code_irc'
                ]
            } );
        }
        controller.setProperties( {
            changeset: changeset,
            isLocked: false,
            currentStep: 0,
            steps: steps
        } );
    },

    renderTemplate(){
        this.render( 'transfers/index/add-edit-template', {
            into: 'authenticated'
        } );
    },

    checkDirtyState( controller ){
        let changeset = controller.get( 'changeset' );

        if( changeset.get( 'isDirty' ) ){
            let response = confirm( 'You have unsaved changes that will be lost. Are you sure you want to navigate away from this page?' );
            if( response ){
                changeset.rollback();
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
