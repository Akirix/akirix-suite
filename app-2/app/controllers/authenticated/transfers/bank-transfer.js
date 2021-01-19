import Ember from 'ember';

export default Ember.Controller.extend( {
    intl: Ember.inject.service(),
    sortProperties: [ 'getName' ],
    sortedTemps: Ember.computed.sort( 'templates', 'sortProperties' ),
    notify: Ember.inject.service(),
    templateProps: ['name','bank_name','account_holder' ],

    availableAmount: function(){
        let changeset = this.get( 'changeset' );
        let accountBalance = this.get( 'fromAccount.balance' );
        let akxUtil = this.get( 'akxUtil' );
        let fee = this.get( 'model.fee' );
        if( changeset.get( 'isDirty' ) ){
            return ( accountBalance - akxUtil.getWireFee( fee, changeset ) ).toFixed( 2 );
        }
        return 0;
    }.property( 'changeset.amount', 'changeset.speedwire' ),

    strMethod: function(){
        return this.get( 'changeset.method' ) === 0 ?
            this.get( 'stringList.wire' ) : this.get( 'stringList.ach' );
    }.property( 'changeset.beneficiary_type' ),

    bankIsUS: function(){
        return this.get( 'changeset.bank_country' ) === 'US';
    }.property( 'changeset.bank_country' ),

    intBankIsUS: function(){
        return this.get( 'changeset.intermediary_bank_country' ) === 'US';
    }.property( 'changeset.intermediary_bank_country' ),

    accountHolderIsUS: function(){
        return this.get( 'changeset.account_holder_country' ) === 'US';
    }.property( 'changeset.account_holder_country' ),

    isPersonal: function(){
        return this.get( 'changeset.beneficiary_type' ) === 0;
    }.property( 'changeset.beneficiary_type' ),

    isACH: function(){
        return this.get( 'changeset.method' ) === 1;
    }.property( 'changeset.method' ),

    allowIntBank: function(){
        return !this.get( 'isACH' );
    }.property( 'isACH' ),

    // Caution HACK
    // This observer removes changeset error for aba field when you type in swift
    removeErrors: function(){
        if( this.get( 'changeset.error.code_aba' ) && this.get( 'changeset.code_swift' ) ){
            this.get( 'changeset' ).validate( 'code_aba' );
        }
    }.observes( 'changeset.code_swift' ),

    setCountryAndAmount: function(){
        if( this.get( 'isACH' ) ){
            this.set( 'changeset.bank_country', 'US' );
            this.set( 'changeset.code_swift', '' );
        }
        else if( this.get( 'changeset.amount' ) > 0 ){
            this.set( 'changeset.amount', 0.00 );
        }
    }.observes( 'changeset.method' ),

    fromAccountIsUSD: function(){
        return this.get( 'fromAccount.currency_id' ) === 'USD';
    }.property( 'fromAccount' ),
    
    beforeExitAccount(){
        let account = this.get( 'model.accounts' ).findBy( 'id', this.get( 'changeset.account_id' ) );
        let steps = this.get( 'steps' );
        let changeset = this.get( 'changeset' );

        if( account.get( 'currency_id' ) !== 'USD' ){
            if( steps[ 3 ].name === 'Method' ){
                steps.splice( 3, 1 );
                this.setProperties( {
                    'changeset.method': 0,
                    templates: this.get( 'templates' ).filter( ( temp )=>{
                        return temp.get( 'method' ) !== 1;
                    } )
                } );
            }
        }
        else {
            if( steps[ 3 ].name !== 'Method' ){
                steps.splice( 3, 0, {
                    name: 'Method',
                    template: 'partials/methods',
                    title: Ember.computed( 'changeset.method', ()=>{
                        if( !Ember.isEmpty( changeset.get( 'method' ) ) ){
                            if( changeset.get( 'method' ) === 0 ){
                                return `${this.get( 'stringList.wire' )} transfer`;
                            }
                            return `${this.get( 'stringList.ach' )} transfer`;
                        }
                        return '&nbsp;';
                    } ),
                    show: false,
                    changeset: changeset,
                    validateFields: [ 'method' ]
                }, );
            }
        }
        this.set( 'steps', steps.splice( 0 ).concat( steps ) );
        this.set( 'changeset.currency_id', account.get( 'currency_id' ) );
        this.set( 'fromAccount', account );
    },

    beforeExitBankInfo(){
        let steps = this.get( 'steps' );
        let changeset = this.get( 'changeset' )

        if( changeset.get( 'code_swift' ) ){
            changeset.set( 'code_swift', changeset.get( 'code_swift' ).toUpperCase() );
        }

        if( changeset.get( 'use_intermediary_bank' ) && this.get( 'allowIntBank' ) ){
            let atStep;
            let deleteCount = 0;
            if( steps[ 3 ].name === 'Method' ){
                if( steps.length > 8 ){
                    deleteCount = 1
                }
                atStep = 5
            }
            else{
                if( steps.length === 8 ){
                    deleteCount = 1
                }
                atStep = 4
            }
            steps.splice( atStep, deleteCount, {
                name: 'Intermediary Bank',
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
        else{
            if( steps.length === 8 && !this.get( 'fromAccountIsUSD' ) ){
                steps.splice( 4, 1 );
            }
            if( steps.length > 8 ){
                steps.splice( 5, 1 );
            }
            if( this.get( 'changeset.template_id' ) === 'no-template' ){
                this.setProperties( {
                    'changeset.intermediary_bank_name': null,
                    'changeset.intermediary_bank_address': null,
                    'changeset.intermediary_bank_city': null,
                    'changeset.intermediary_bank_country': null,
                    'changeset.intermediary_bank_state_province': null,
                    'changeset.intermediary_bank_postal_code': null,
                    'changeset.intermediary_bank_code_aba': null,
                    'changeset.intermediary_bank_code_swift': null,
                    'changeset.intermediary_bank_code_irc': null
                } );
            }
        }
        this.set( 'steps', steps.splice( 0 ).concat( steps ) );
    },

    transitionToUri( step ){
        this.get( 'changeset' ).rollback();
        this.get( 'model.wire' ).destroyRecord().then( ()=>{
            if( step.queryParams ){
                this.transitionToRoute( step.link, step.queryParams );
            }
            else{
                this.transitionToRoute( step.link );
            }
        } );
    },

    actions: {
        useTemplate: function( id ){
            let template = this.get( 'templates' ).findBy( 'id', id );
            if( !Ember.isEmpty( template ) ){
                this.setProperties( {
                    'changeset.method': template.get( 'method' ),
                    'changeset.beneficiary_type': template.get( 'beneficiary_type' ),
                    'changeset.purpose': template.get( 'purpose' ),
                    'changeset.notes': template.get( 'notes' ),
                    'changeset.bank_name': template.get( 'bank_name' ),
                    'changeset.bank_address': template.get( 'bank_address' ),
                    'changeset.bank_city': template.get( 'bank_city' ),
                    'changeset.bank_state_province': template.get( 'bank_state_province' ),
                    'changeset.bank_postal_code': template.get( 'bank_postal_code' ),
                    'changeset.bank_country': template.get( 'bank_country' ),
                    'changeset.code_swift': template.get( 'code_swift' ),
                    'changeset.code_aba': template.get( 'code_aba' ),
                    'changeset.code_irc': template.get( 'code_irc' ),
                    'changeset.account_holder': template.get( 'account_holder' ),
                    'changeset.account_number': template.get( 'account_number' ),
                    'changeset.account_iban': template.get( 'account_iban' ),
                    'changeset.account_holder_dob': template.get( 'account_holder_dob' ),
                    'changeset.account_holder_address': template.get( 'account_holder_address' ),
                    'changeset.account_holder_city': template.get( 'account_holder_city' ),
                    'changeset.account_holder_state_province': template.get( 'account_holder_state_province' ),
                    'changeset.account_holder_postal_code': template.get( 'account_holder_postal_code' ),
                    'changeset.account_holder_country': template.get( 'account_holder_country' ),
                    'changeset.account_holder_nationality': template.get( 'account_holder_nationality' ),
                    'changeset.intermediary_bank_code_aba': template.get( 'intermediary_bank_code_aba' ),
                    'changeset.intermediary_bank_code_swift': template.get( 'intermediary_bank_code_swift' ),
                    'changeset.intermediary_bank_name': template.get( 'intermediary_bank_name' ),
                    'changeset.intermediary_bank_address': template.get( 'intermediary_bank_address' ),
                    'changeset.intermediary_bank_city': template.get( 'intermediary_bank_city' ),
                    'changeset.intermediary_bank_state_province': template.get( 'intermediary_bank_state_province' ),
                    'changeset.intermediary_bank_postal_code': template.get( 'intermediary_bank_postal_code' ),
                    'changeset.intermediary_bank_country': template.get( 'intermediary_bank_country' ),
                    'changeset.selected': true,
                    'changeset.template_id': id
                } );
                if( this.get( 'changeset.intermediary_bank_name' ) ){
                    this.set( 'changeset.use_intermediary_bank', 1 );
                }
                else{
                    this.set( 'changeset.use_intermediary_bank', 0 );
                }
            }
            this.send( 'nextStep', 2 );
        },
    
        withoutTemplate: function(){
            let changeset = this.get( 'changeset' );
            
            this.setProperties( {
                'changeset.method': null,
                'changeset.beneficiary_type': null,
                'changeset.purpose': null,
                'changeset.notes': null,
                'changeset.bank_name': null,
                'changeset.bank_address': null,
                'changeset.bank_city': null,
                'changeset.bank_state_province': null,
                'changeset.bank_postal_code': null,
                'changeset.bank_country': null,
                'changeset.code_swift': null,
                'changeset.code_aba': null,
                'changeset.code_irc': null,
                'changeset.account_holder': null,
                'changeset.account_number': null,
                'changeset.account_iban': null,
                'changeset.account_holder_dob': null,
                'changeset.account_holder_address': null,
                'changeset.account_holder_city': null,
                'changeset.account_holder_state_province': null,
                'changeset.account_holder_postal_code': null,
                'changeset.account_holder_country': null,
                'changeset.account_holder_nationality': null,
                'changeset.intermediary_bank_code_aba': null,
                'changeset.intermediary_bank_code_swift': null,
                'changeset.intermediary_bank_name': null,
                'changeset.intermediary_bank_address': null,
                'changeset.intermediary_bank_city': null,
                'changeset.intermediary_bank_state_province': null,
                'changeset.intermediary_bank_postal_code': null,
                'changeset.intermediary_bank_country': null,
                'changeset.selected': true,
                'changeset.template_id': 'no-template',
                'changeset.use_intermediary_bank': 0
            } );
            if( !this.get( 'fromAccountIsUSD' ) ){
                changeset.set( 'method', 0 );
            }
            Ember.$( '.chosen' ).removeClass( 'chosen' );
            Ember.$( '.without' ).addClass( 'chosen' );
            this.send( 'nextStep', 2 );
        },
        saveModel(){
            let changeset = this.get( 'changeset' );
            changeset.save().then( ()=>{
                this.set( 'isLocked', false );
                this.get( 'fromAccount' ).reload();
                this.transitionToRoute( 'authenticated.transfers.success', {
                    queryParams: {
                        wire_id: changeset.get( 'id' ),
                        from_account_id: changeset.get( 'account_id' ),
                        template_id: changeset.get( 'template_id' ),
                        wire_type: 2
                    }
                } );
            } ).catch( ( err )=>{
                this.set( 'isLocked', false );
                this.send( 'error', err );
            } );
        },
        deleteModel(){
            this.get( 'model.wire' ).destroyRecord().then( ()=>{
                this.get( 'changeset' ).rollback();
                this.transitionToRoute( 'authenticated.transfers' );
            } );
        },
        redraw(){
            let step = this.get( 'steps' ).find( ( step )=>{
                return step.name === 'Bank Information';
            } );
            let template = step.template;
            Ember.set( step, 'template', step.secondTemplate );
            Ember.set( step, 'secondTemplate', template );
        },
        nextStep( idx ){
            idx = idx >=0 ? idx: this.get( 'currentStep' );
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