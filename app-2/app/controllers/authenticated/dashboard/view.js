import Ember from 'ember';

export default Ember.Controller.extend( {
    notify: Ember.inject.service(),
    session: Ember.inject.service(),

    getCompanyName: function(){
      return this.get( 'session.data.authenticated.company.name' );
    }.property( 'session' ),

    getCompanyAkxNumber: function(){
      return this.get( 'session.data.authenticated.company.account_number' );
    }.property( 'session' ),

    filteredInstructions: function(){
        const model = this.get( 'model' );
        const currencyID = model.account.get( 'currency_id' );
        const accountID = model.account.get( 'id' );
        const res = model.preferredWireInstructions.filter( ( instruction )=>{
            return ( instruction.get( 'currency_id' ) === currencyID ) && ( accountID === instruction.get( 'account_id' ) );
        } );

        if( Ember.isEmpty( res ) ){
            return model.wireInstructions.filter( ( instruction )=>{
                return ( instruction.get( 'currency_id' ) === currencyID ) && ( !instruction.get( 'account_id' ) )
            } );
        }
        return res;
    }.property( 'model.wireInstructions.length', 'model.preferredWireInstructions.length' ),

    actions: {
        sendInstructions(){
            let changeset = this.get( 'changeset' );
            changeset.validate().then( ()=>{
                if( changeset.get( 'isValid' ) ){
                    return changeset.save();
                }
            } ).then( ()=>{
                if( changeset.get( 'isValid' ) ){
                    return this.get( 'akxUtil' ).authAjax( {
                        type: 'POST',
                        data: JSON.stringify( { data: changeset.get( '_content' ) } )
                    }, '/wires/sendInstructions' );
                }
            } ).then( ()=>{
                this.set( 'isLocked', false );
                if( changeset.get( 'isValid' ) ){
                    this.get( 'notify' ).success( this.get( 'stringList.emailSent' ), {
                        classNames: [ 'bg-success' ]
                    } );
                    this.send( 'closeSidePanel' );
                }
            } ).catch( ( err )=>{
                this.set( 'isLocked', false );
                this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
            } );
        }
    }
} );
