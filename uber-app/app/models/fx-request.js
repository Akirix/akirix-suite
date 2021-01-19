import DS from 'ember-data';
import config from 'uber-app/config/environment';

var locale = new Globalize( navigator.language );

export default DS.Model.extend( {
    from_account_id: DS.attr(),
    to_account_id: DS.attr(),
    company_id: DS.attr(),
    name: DS.attr(),
    base_currency_id: DS.attr(),
    base_amount: DS.attr(),
    counter_currency_id: DS.attr(),
    counter_amount: DS.attr(),
    base_rate: DS.attr(),
    customer_rate: DS.attr(),
    type: DS.attr(),
    status: DS.attr(),
    reference: DS.attr(),
    notes: DS.attr(),
    confirmation: DS.attr(),
    created_at: DS.attr(),
    updated_at: DS.attr(),

    company: DS.belongsTo( 'company', { async: true } ),
    baseCurrency: DS.belongsTo( 'currency', { async: true } ),
    counterCurrency: DS.belongsTo( 'currency', { async: true } ),
    fromAccount: DS.belongsTo( 'account', { async: true } ),
    toAccount: DS.belongsTo( 'account', { async: true } ),

    //for the dashboard use
    isStarted: function(){
        return this.get( 'status' ) === 1;
    }.property( 'status' ),

    isDone: function(){
        return this.get( 'status' ) === 2;
    }.property( 'status' ),

    str_base_amount: function(){
        return locale.format( Number( this.get( 'base_amount' ) ), 'n2' );
    }.property( 'base_amount' ),

    str_counter_amount: function(){
        return locale.format( Number( this.get( 'counter_amount' ) ), 'n2' );
    }.property( 'counter_amount' ),

    str_cost_amount: function(){
        return locale.format( Number( this.get( 'counter_amount' ) / this.get( 'base_rate' ) ), 'n2' );
    }.property( 'counter_amount', 'base_rate' ),

    str_total_counter_amount: function(){
        return locale.format( Number( this.get( 'base_amount' ) * this.get( 'base_rate' ) ), 'n2' );
    }.property( 'base_amount', 'base_rate' ),

    str_customer_rate: function(){
        return locale.format( Number( this.get( 'customer_rate' ) ), 'n6' );
    }.property( 'customer_rate' ),

    str_base_rate: function(){
        return locale.format( Number( this.get( 'base_rate' ) ), 'n6' );
    }.property( 'base_rate' ),

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

    str_type: function(){
        switch( this.get( 'type' ) ){
            case 0:
                return 'External FX';
            case 1:
                return 'Akirix Internal FX';
            default:
                return '';
        }
    }.property( 'type' )
} );