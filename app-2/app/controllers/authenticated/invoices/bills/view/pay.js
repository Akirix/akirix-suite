import Ember from 'ember';

export default Ember.Controller.extend( {

    timeRanges: function(){
        let stringList = this.get( 'stringList' );
        return [ stringList.daily, stringList.weekly, stringList.monthly, stringList.yearly ]
    }.property(),

    amountRanges: function(){
        let stringList = this.get( 'stringList' );
        return [
            `${stringList.lessThan} 10,000`,
            '10,000 - 100,000',
            '100,000 - 250,000',
            '250,000 - 500,000',
            '500,000 - 1,000,000',
            `${stringList.moreThan} 1,000,000`
        ]
    }.property(),

    actions: {
        close(){
            if( this.get( 'changeset' ) ){
                this.get( 'changeset' ).rollback();
            }
            this.transitionToRoute( 'authenticated.invoices.bills' );
            this.send( 'closeSidePanel', true );
        },
        payInvoice(){
            let changeset = this.get( 'changeset' );
            changeset.validate().then( ()=>{
                if( changeset.get( 'isValid' ) ){
                    let payLoad = {
                        amount: changeset.get( 'amount' ),
                        account_id: changeset.get( 'account_id' )
                    };
                    return this.get( 'akxUtil' ).authAjax( {
                        type: 'post',
                        data: JSON.stringify( { data: payLoad } )
                    }, `/invoices/${changeset.get( 'invoice_id' )}/pay` );
                }
                return changeset.get( 'isValid' );
            } ).then( ( isValid )=>{
                this.set( 'isLocked', false );
                if( isValid ){
                    this.get( 'model.invoice' ).reload();
                    this.send( 'openSidePanel', 'invoices/pay-success', 'invoices/side-panel-nav', this );
                }
            } ).catch( ( err )=>{
                this.set( 'isLocked', false );
                if( err instanceof Ember.Error ){
                    this.send( 'error', err );
                }
                else{
                    this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
                }
            } );
        },
        newAccount(){
            // Not sure whether to add ticket title and tickMessage notes to stringList or leave it hard coded
            let changeset = this.get( 'changeset' );
            changeset.validate().then( ()=>{
                if( changeset.get( 'isValid' ) ){
                    return changeset.save();
                }
                return changeset.get( 'isValid' );
            } ).then( ( isValid )=>{
                if( isValid ){
                    return this.store.createRecord( 'ticket', {
                        title: 'New Account Request'
                    } ).save();
                }
                return isValid;
            } ).then( ( ticket )=>{
                if( ticket ){
                    let message = `Requesting a new ${changeset.get('currency_type')} 
                    account with the purpose of ${changeset.get('purpose')}. With estimated 
                    average balance between ${changeset.get('average_balance')} and with 
                    ${changeset.get('volume_in_frequency')} volume in between ${changeset.get('volume_in')}. 
                    and ${changeset.get('volume_out_frequency')} volume out between 
                    ${changeset.get('volume_out')}`;

                    return this.store.createRecord( 'ticket-message', {
                        ticket_id: ticket.id,
                        notes: message
                    } ).save();
                }
                return ticket;
            } ).then( ( isValid )=>{
                this.set( 'isLocked', false );
                if( isValid ){
                    this.set( 'success', true );
                }
            } ).catch( ( err )=>{
                this.set( 'isLocked', false );
                this.send( 'error', err );
            } );
        }
    }
} );