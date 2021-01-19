import Ember from 'ember';

export default Ember.Controller.extend( {

    availableAmount: function(){
        let fee = Number( this.get( 'model.fee' ).get( 'fee_book_transfer' ) );
        let totalFee = ( this.get( 'changeset.amount' ) * fee );
        if( this.get( 'changeset.isDirty' ) ){
            return( this.get( 'fromAccount.balance' ) - totalFee ).toFixed( 2 );
        }
        return 0;
    }.property( 'changeset.amount' ),

    getFee: function(){
        let fee = Number( this.get( 'model.fee' ).get( 'fee_book_transfer' ) );
        return ( this.get( 'changeset.amount' ) * fee );
    }.property( 'changeset.amount' ),

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

    beforeExitAccount(){
        let account = this.get( 'model.accounts' ).findBy( 'id', this.get( 'changeset.account_id' ) );
        this.set( 'changeset.currency_id', account.get( 'currency_id' ) );
        this.set( 'fromAccount', account );
    },

    actions: {
        saveModel(){
            let changeset = this.get( 'changeset' );
            changeset.save().then( ()=>{
                this.set( 'isLocked', false );
                this.get( 'fromAccount' ).reload();
                this.transitionToRoute( 'authenticated.transfers.success', {
                    queryParams: {
                        wire_id: changeset.get( 'id' ),
                        from_account_id: changeset.get( 'account_id' ),
                        wire_type: 1
                    }
                } );
            } ).catch( ( err )=>{
                this.set( 'isLocked', false );
                this.send( 'error', err );
            } );
        },
        deleteModel(){
            this.get( 'changeset' ).rollback();
            this.get( 'model.wire' ).destroyRecord().then( ()=>{
                this.transitionToRoute( 'authenticated.transfers' );
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