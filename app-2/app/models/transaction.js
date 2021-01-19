import DS from 'ember-data';
import StringObjectMixin from 'akx-app/mixins/model-locale';

export default DS.Model.extend( StringObjectMixin, {
    account_id: DS.attr(),
    currency_id: DS.attr(),
    from_account_id: DS.attr(),
    to_account_id: DS.attr(),

    created_at: DS.attr(),
    updated_at: DS.attr(),
    order: DS.attr(),
    model: DS.attr(),
    model_id: DS.attr(),
    amount: DS.attr( 'number' ),
    status: DS.attr( 'number' ),
    type: DS.attr( 'number' ),

    currency: DS.belongsTo( 'currency', { async: true } ),
    fromAccount: DS.belongsTo( 'account', { async: true } ),
    toAccount: DS.belongsTo( 'account', { async: true } ),

    isNotFee: function(){
        return ( this.get( 'type' ) !== 3 );
    }.property( 'type' ),

    isCharge: function(){
        return (this.get( 'model' ) === 'charge' && this.get( 'type' ) === 3 );
    }.property( 'model', 'type' ),

    isPoint: function(){
        return ( this.get( 'type' ) === 2 );
    }.property( 'type' ),

    isBalance: function(){
        return ( this.get( 'type' ) === 7 );
    }.property( 'type' ),

    isDebit: function(){
        return this.get( 'from_account_id' ) === this.get( 'account_id' );
    }.property( 'account_id', 'from_account_id' ),

    isCredit: function(){
        return this.get( 'to_account_id' ) === this.get( 'account_id' );
    }.property( 'account_id', 'to_account_id' ),

    isInvoice: function(){
        return this.get( 'model' ) === 'invoice';
    }.property( 'model' ),

    getInvoiceOrBill: function(){
        return this.get( 'isDebit' ) ? this.get( 'getStringList' )[ 'bill' ] :  this.get( 'getStringList' )[ this.get( 'model' ) ]
    }.property( 'model', 'isDebit' ),

    getName: function(){
        if( this.get( 'model' ) && this.get( 'model_id' ) ){
            if( this.get( 'isInvoice' ) ){
                return this.get( 'getInvoiceOrBill' );
            }
            return this.get( 'getStringList' )[ this.get( 'model' ) ];
        }
        return this.get( 'getStringList.accountTransfer' );
    }.property( 'model', 'model_id' )
} );

