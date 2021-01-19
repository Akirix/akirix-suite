import DS from 'ember-data';
var locale = new Globalize( navigator.language );

export default DS.Model.extend( {
    affiliate_id: DS.attr(),
    currency_id: DS.attr(),
    uber_user_id: DS.attr(),

    status: DS.attr(),
    amount: DS.attr(),
    payout_date: DS.attr(),
    
    uberUser: DS.belongsTo( 'uber-user', { async: true } ),
    affiliate: DS.belongsTo( 'company', { async: true } ),
    commissionPaymentItems: DS.hasMany( 'commission-payment-items', { async: true } ),
    currency: DS.belongsTo( 'currency', { async: true } ),

    str_period_from: function(){
        return moment( this.get( 'period_from' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'period_from' ),

    str_period_to: function(){
        return moment( this.get( 'period_to' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'period_to' ),

    str_payout_date: function(){
        return moment( this.get( 'payout_date' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'payout_date' ),

    str_amount: function(){
        return locale.format( Number( this.get( 'amount' ) ), 'n2' );
    }.property( 'amount' )
} );