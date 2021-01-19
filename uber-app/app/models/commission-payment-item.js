import DS from 'ember-data';

var locale = new Globalize( navigator.language );

export default DS.Model.extend( {
    commission_id: DS.attr(),
    affiliate_id: DS.attr(),
    commission_payment_id: DS.attr(),
    currency_id: DS.attr(),
    company_id: DS.attr(),

    amount: DS.attr(),
    rate: DS.attr(),
    period_from: DS.attr(),
    period_to: DS.attr(),

    commission_payment: DS.belongsTo( 'commission_payment', { async: true } ),
    currency: DS.belongsTo( 'currency', { async: true } ),
    affiliate: DS.belongsTo( 'company', { async: true } ),
    company: DS.belongsTo( 'company', { async: true } ),

    str_period_from: function(){
        return moment( this.get( 'period_from' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'period_from' ),

    str_period_to: function(){
        return moment( this.get( 'period_to' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'period_to' ),

    str_amount: function(){
        return locale.format( Number( this.get( 'amount' ) ), 'n2' );
    }.property( 'amount' ),

    str_rate: function(){
        return math.round( Number( this.get( 'rate' ) ) * 100, 2 ) + '%';
    }.property( 'rate' )

} );

