import DS from 'ember-data';
var locale = new Globalize( navigator.language );

export default DS.Model.extend( {
    currency_id: DS.attr(),
    from_account_id: DS.attr(),
    to_account_id: DS.attr(),
    account_id: DS.attr(),

    order: DS.attr(),
    created_at: DS.attr(),
    updated_at: DS.attr(),
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
    }.property( 'type', 'parent_id' ),

    isFee: function(){
        return ( this.get( 'type' ) === 3 );
    }.property( 'type' ),

    isPoint: function(){
        return ( this.get( 'type' ) === 2 );
    }.property( 'type' ),

    isBalance: function(){
        return ( this.get( 'type' ) === 7 );
    }.property( 'type' ),

    str_amount: function(){
        return locale.format( Number( this.get( 'amount' ) ), 'n2' );
    }.property( 'amount' ),

    str_created_at_date: function(){
        return moment( this.get( 'created_at' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'created_at' ),

    str_created_at_time: function(){
        return moment( this.get( 'created_at' ) ).utc().format( 'HH:mm:ss' );
    }.property( 'created_at' ),

    str_updated_at_date: function(){
        return moment( this.get( 'updated_at' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'updated_at' ),

    str_updated_at_time: function(){
        return moment( this.get( 'updated_at' ) ).utc().format( 'HH:mm:ss' );
    }.property( 'updated_at' ),

    str_sign: function(){
        if( this.get( 'from_account_id' ) === this.get( 'account_id' ) ){
            return '-';
        }
        else{
            return '+';
        }
    }.property( 'account_id', 'from_account_id' ),

    str_sign_color: function(){
        if( this.get( 'from_account_id' ) === this.get( 'account_id' ) ){
            return '<span class="text-rose">' + this.get( 'str_sign' ) + '</span>';
        }
        else{
            return '<span class="text-green">' + this.get( 'str_sign' ) + '</span>';
        }
    }.property( 'account_id', 'from_account_id', 'str_sign' ),

    isCredit: function(){
        return this.get( 'from_account_id' ) !== this.get( 'account_id' );
    }.property( 'account_id', 'from_account_id', 'str_sign' ),

    isDebit: function(){
        return this.get( 'from_account_id' ) === this.get( 'account_id' );
    }.property( 'account_id', 'from_account_id', 'str_sign' )

} );

