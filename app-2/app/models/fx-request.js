import DS from 'ember-data';

export default DS.Model.extend( {
    from_account_id: DS.attr(),
    to_account_id: DS.attr(),
    company_id: DS.attr(),
    name: DS.attr(),
    base_currency_id: DS.attr(),
    base_amount: DS.attr(),
    counter_currency_id: DS.attr(),
    counter_amount: DS.attr(),
    customer_rate: DS.attr(),
    type: DS.attr(),
    status: DS.attr(),
    reference: DS.attr(),
    notes: DS.attr(),
    confirmation: DS.attr(),
    created_at: DS.attr(),

    baseCurrency: DS.belongsTo( 'currency', { async: true } ),
    counterCurrency: DS.belongsTo( 'currency', { async: true } ),
    fromAccount: DS.belongsTo( 'account', { async: true } ),
    toAccount: DS.belongsTo( 'account', { async: true } ),

    isDone: function(){
        return this.get( 'status' ) === 2;
    }.property( 'status' )
} );