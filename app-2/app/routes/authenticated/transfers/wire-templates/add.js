import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';
import DirtyCheck from 'akx-app/mixins/dirty-check';
import lookupValidator from 'ember-changeset-validations';
import Changeset from 'ember-changeset';
import templateValidations from 'akx-app/validations/wire-templates'

export default Ember.Route.extend( StringObjectMixin, DirtyCheck, {
    model(){
        return Ember.RSVP.hash( {
            wireTemplate: this.store.createRecord( 'wire-template' ),
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

        controller.setProperties( {
            changeset: changeset,
            isLocked: false,
            currentStep: 0,
            steps: [
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
                        return '&nbsp;'
                    } ),
                    changeset: changeset,
                    validateFields: [ 'method' ]
                },
                {
                    name: 'Bank Information',
                    template: 'partials/bank-information',
                    beforeExit: controller.beforeExitBankInfo.bind( controller ),
                    title: Ember.computed( 'changeset.bank_name', ()=>{
                        return changeset.get( 'bank_name' ) ?
                                changeset.get( 'bank_name' ) :
                                '&nbsp;'
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
                        return changeset.get( 'account_holder' ) ?
                                changeset.get( 'account_holder' ) :
                                '&nbsp;'
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
                        return changeset.get( 'name' ) ?
                                changeset.get( 'name' ) :
                                '&nbsp;'
                    } ),
                    show: true,
                    changeset: changeset,
                    validateFields: [ 'name', 'notes' ]
                },
                {
                    name: 'Confirm Details',
                    template: 'partials/view-changeset-template',
                    title: '&nbsp;',
                    show: true
                }
            ]
        } );
    },

    renderTemplate(){
        this.render( 'transfers/index/add-edit-template', {
            into: 'authenticated'
        } );
    },

    checkDirtyState( controller ){
        let changeset = controller.get( 'changeset' );
        let wireTemplate = controller.get( 'model.wireTemplate' );

        if( changeset.get( 'isDirty' ) || ( !wireTemplate.get( 'isDeleted' ) && wireTemplate.get( 'isNew' ) ) ){
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
