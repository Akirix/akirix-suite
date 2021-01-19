import Ember from 'ember';

export default Ember.Controller.extend( {
    intl: Ember.inject.service(),

    strMethod: function(){
        return this.get( 'changeset.method' ) === 0 ?
            this.get( 'stringList.wire' ) : this.get( 'stringList.ach' );
    }.property( 'changeset.beneficiary_type' ),

    isPersonal: function(){
        return this.get( 'changeset.beneficiary_type' ) === 0;
    }.property( 'changeset.beneficiary_type' ),

    allowIntBank: function(){
        return !this.get( 'isACH' );
    }.property( 'changeset.method' ),

    isACH: function(){
        return this.get( 'changeset.method' ) === 1;
    }.property( 'changeset.method' ),

    setCountry: function(){
        if( this.get( 'isACH' ) ){
            this.set( 'changeset.bank_country', 'US' );
        }
    }.observes( 'changeset.method' ),

    intBankIsUS: function(){
        return this.get( 'changeset.intermediary_bank_country' ) === 'US';
    }.property( 'changeset.intermediary_bank_country' ),
    
    bankIsUS: function(){
        return this.get( 'changeset.bank_country' ) === 'US';
    }.property( 'changeset.bank_country' ),

    accountHolderIsUS: function(){
        return this.get( 'changeset.account_holder_country' ) === 'US';
    }.property( 'changeset.account_holder_country' ),

    beforeExitBankInfo: function(){
        let steps = this.get( 'steps' );
        let changeset = this.get( 'changeset' );

        if( changeset.get( 'code_swift' ) ){
            changeset.set( 'code_swift', changeset.get( 'code_swift' ).toUpperCase() );
        }
        
        if( changeset.get( 'use_intermediary_bank' ) ){
            if( steps.length < 6 ){
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
        }
        else{
            if( steps.length > 5 ){
                steps.splice( 2, 1 );
            }
        }
        this.set( 'steps', this.get( 'steps' ).splice( 0 ).concat( steps ) );
    },

    actions: {
        saveModel(){
            let changeset = this.get( 'changeset' );
            changeset.validate().then( ()=>{
                if( changeset.get( 'isValid' ) ){
                    return changeset.save();
                }
            } ).then( ()=>{
                this.set( 'isLocked', false );
                if( changeset.get( 'isValid' ) ){
                    this.transitionToRoute(
                        'authenticated.transfers.wire-templates.success',
                        {
                            queryParams: {
                                wire_template_id: changeset.get( 'id' )
                            }
                        }
                    );
                }
            } ).catch( ( err )=>{
                this.set( 'isLocked', false );
                this.send( 'error', err );
            } );
        },
        deleteModel(){
            this.get( 'changeset' ).rollback();
            this.transitionToRoute( 'authenticated.transfers.wire-templates' );
        },
        redraw(){
            let step = this.get( 'steps' )[ 1 ];
            let template = step.template;
            Ember.set( step, 'template', step.secondTemplate );
            Ember.set( step, 'secondTemplate', template );
        },
        nextStep(){
            let idx = this.get( 'currentStep' );
            let step = this.get( 'steps' )[ idx ];
            if( Ember.isEmpty( step.validateFields ) ){
                if( step.beforeExit ){
                    step.beforeExit().then( ()=>{
                        this.set( 'currentStep', idx + 1 );
                    } );
                }
                else{
                    this.set( 'currentStep', idx + 1 );
                }
            }
            else{
                let changeset = this.get( 'changeset' );
                let promises = [];
                step.validateFields.forEach( ( valItem ) =>{
                    promises.push( changeset.validate( valItem ) );
                } );
                Ember.RSVP.Promise.all( promises ).then( ()=>{
                    if( changeset.get( 'isValid' ) ){
                        if( step.beforeExit ){
                            return step.beforeExit();
                        }
                    }
                } ).then( ()=>{
                    if( changeset.get( 'isValid' ) ){
                        this.set( 'currentStep', idx + 1 );
                    }
                } );
            }
        }
    }
} );