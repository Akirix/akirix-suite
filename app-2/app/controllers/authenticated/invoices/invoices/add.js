import Ember from 'ember';

export default Ember.Controller.extend( {
    session: Ember.inject.service(),
    intl: Ember.inject.service(),

    toCompanyIsUs: function(){
        return this.get( 'changeset.to_company_country' ) === 'US';
    }.property( 'changeset.to_company_country' ),

    beforeExitType(){
        let changeset = this.get( 'changeset' );

            Ember.run( ()=>{
                let steps = this.get( 'steps' );
                if( changeset.get( 'type' ) === 2 ){
                    steps.splice( 2, 1, {
                        name: 'Company Information',
                        beforeExit: this.beforeExitCompany.bind( this ),
                        template: 'invoices/off-platform-company',
                        title: Ember.computed( 'changeset.to_company_name', ()=>{
                            if( changeset.get( 'to_company_name' ) ){
                                return `${changeset.get( 'to_company_name' )}`
                            }
                            return '&nbsp;'
                        } ),
                        changeset: changeset,
                        show: true,
                        validateFields: [ 'to_company_name', 'to_company_email' ]
                    } );
                }
                else{
                    steps.splice( 2, 1, {
                        name: 'Company',
                        beforeExit: this.beforeExitCompany.bind( this ),
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
                    } );
                }
                this.set( 'steps', this.get( 'steps' ).splice( 0 ).concat( steps ) );
            } );
    },

    beforeExitAccounts(){
        let changeset = this.get( 'changeset' )
        let account = this.get( 'accounts' ).findBy( 'id', changeset.get( 'account_id' ) );
        changeset.set( 'currency_id', account.get( 'currency_id' ) );
        return Ember.RSVP.Promise.resolve();
    },

    beforeExitCompany(){
        return this.get( 'changeset' ).save().catch( ( err )=>{
            this.set( 'isLocked', false );
            this.send( 'error', err );
        } );
    },

    beforeExitDetails(){
        const changeset = this.get( 'changeset' );
        const amount = changeset.get( 'amount' );

        return this.saveInvoice().then( ()=>{
            this.set( 'model.invoice_items', changeset.get( 'invoiceItems' ) );
            this.set( 'changeset.invoice_period_from', this.get( 'intl' ).formatDate( changeset.get( 'invoice_period_from' ) ) );
            this.set( 'changeset.invoice_period_to', this.get( 'intl' ).formatDate(changeset.get( 'invoice_period_to' ) ) );
            this.set( 'changeset.amount', amount );
        } );
    },

    saveInvoice(){
        let changeset = this.get( 'changeset' );
        let promises = Ember.A();
        changeset.get( 'invoiceItems' ).forEach( ( item )=>{
            promises.push( item.save() );
        } );
        promises.push( changeset.save() );
        return Ember.RSVP.Promise.all( promises );
    },

    actions: {
        sendInvoice(){
            let changeset = this.get( 'changeset' );
            this.saveInvoice().then( ()=>{
                // Activate Invoice
                return this.get( 'akxUtil' ).authAjax( {
                    type: 'post'
                }, `/invoices/${changeset.get( 'id' )}/activate` );
            } ).then( ()=>{
                // Transition to success Page
                this.set( 'isLocked', false );
                this.transitionToRoute( 'authenticated.invoices.invoices.success', {
                    queryParams: {
                        invoice_id: changeset.get( 'id' )
                    }
                } );
            } ).catch( ( err )=>{
                this.set( 'isLocked', false );
                this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
            } );
        },
        saveModel(){
            this.saveInvoice().then( ()=>{
                // Transition to success Page
                this.transitionToRoute( 'authenticated.invoices.invoices.success', {
                    queryParams: {
                        invoice_id: this.get( 'changeset.id' )
                    }
                } );
            } );
        },
        deleteModel(){
            let promises = Ember.A();
            let changeset = this.get( 'changeset' );
            changeset.get( 'invoiceItems' ).forEach( function( item ){
                promises.push( item.destroyRecord() );
            } );
            if( !Ember.isEmpty( changeset.get( 'documents' ) ) ){
                changeset.get( 'documents' ).forEach( function( item ){
                    promises.push( item.destroyRecord() );
                } );
            }
            changeset.rollback();
            Ember.RSVP.Promise.all( promises ).then( ()=>{
                return this.get( 'model.invoice' ).destroyRecord();
            } ).then( ()=>{
                this.transitionToRoute( 'authenticated.invoices.invoices' );
            } ).catch( ( err )=>{
                this.send( 'error', err );
            } );
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
