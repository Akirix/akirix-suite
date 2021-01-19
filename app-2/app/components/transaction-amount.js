import Ember from 'ember';

export default Ember.Component.extend( {
    intl: Ember.inject.service(),
    session: Ember.inject.service( 'session' ),
    store: Ember.inject.service(),

    strTotalAmount: function(){
        return this.get( 'intl' ).formatNumber( this.get( 'total_amount' ), {
            minimumFractionDigits: 2,
            style: 'currency',
            currency: this.get( 'transaction.currency_id' )
        } );
    }.property( 'total_amount' ),

    getTotals: function(){
        let model = this.get( 'transaction.model' );
        let model_id = this.get( 'transaction.model_id' );
        switch( model ){
            case 'invoice':
                this.get( 'store' ).findRecord( model, model_id ).then( ( invoice )=>{
                    // Only when is payer, add all fees paid to invoice amount
                    if( invoice.get( 'company_id' ) !== this.get( 'session.data.authenticated.company.id' ) ){
                        this.get( 'store' ).query( 'transaction', {
                            from_account_id: this.get( 'transaction.account_id' ),
                            parent_id: this.get( 'transaction.id' ),
                            type: 3
                        } ).then( ( transactions )=>{
                            this.set( 'total_amount', transactions.reduce( ( acc, trans )=>{
                                return acc + trans.get( 'amount' );
                            }, this.get( 'transaction.amount' ) ) );
                        } );
                    }
                    else{
                        return this.set( 'total_amount', this.get( 'transaction.amount' ) );
                    }
                } );
                break;
            default:
                return this.set( 'total_amount', this.get( 'transaction.amount' ) );
        }
    }.on( 'init' )
} );
