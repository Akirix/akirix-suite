import Ember from 'ember';

export default Ember.Controller.extend( {

    availableAmount: function(){
        return this.get( 'fromAccount.balance' ).toFixed( 2 );
    }.property( 'fromAccount.balance' ),
    
    toAccount: function(){
        return this.get( 'model.accounts' ).findBy( 'id', this.get( 'changeset.account_id' ) );
    }.property( 'fromAccount.balance' ),

    transitionToUri( step ){
        if( step.queryParams ){
            this.transitionToRoute( step.link, step.queryParams );
        }
        else{
            this.transitionToRoute( step.link );
        }
    },

    beforeExitAccount(){
        let account = this.get( 'model.accounts' ).findBy( 'id', this.get( 'changeset.from_account_id' ) );
        Ember.set( this.get( 'model' ), 'toAccounts', this.get( 'model.accounts' ).filter( ( acc )=>{
            return acc.id !== account.id && acc.get( 'currency_id' ) === account.get( 'currency_id' );
        } ) );
        this.set( 'fromAccount', account );
    },

    actions: {
        saveModel(){
            let changeset = this.get( 'changeset' );
            let accountId = changeset.get( 'from_account_id' );
            let payload = {
                amount: changeset.get( 'amount' ),
                to_account_id: changeset.get( 'account_id' )
            };
            this.get( 'akxUtil' ).authAjax( {
                type: 'post',
                data: JSON.stringify( { data: payload } )
            }, '/accounts/' + accountId + '/transfer' ).then( ()=>{
                return changeset.save();
            } ).then( ()=>{
                this.set( 'isLocked', false);
                this.get( 'fromAccount' ).reload();
                this.transitionToRoute( 'authenticated.transfers.success', {
                    queryParams: {
                        from_account_id: changeset.get( 'from_account_id' ),
                        to_account_id: changeset.get( 'account_id' ),
                        amount: changeset.get( 'amount' ),
                        wire_type: 0
                    }
                } );
            } ).catch( ( err )=>{
                this.set( 'isLocked', false);
                this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
            } );
        },
        deleteModel(){
            this.get( 'changeset' ).rollback();
            this.transitionToRoute( 'authenticated.transfers' );
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
