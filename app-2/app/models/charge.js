import DS from 'ember-data';

export default DS.Model.extend( {
    account_id: DS.attr(),
    company_id: DS.attr(),
    amount: DS.attr( 'number' ),
    currency_id: DS.attr(),
    type: DS.attr( 'number' ),
    status: DS.attr( 'number' ),
    start_date: DS.attr( 'date' ),
    title: DS.attr(),
    notes: DS.attr(),
    frequency: DS.attr( 'number' ),
    frequency_type: DS.attr(),
    next_payment_date: DS.attr( 'date' ),
    fee_counter: DS.attr( 'number' ),
    created_at: DS.attr(),
    updated_at: DS.attr(),

    currency: DS.belongsTo( 'currency', { async: true } ),
    account: DS.belongsTo( 'account', { async: true } ),

    isOneTime: function(){
        return this.get( 'type' ) === 0;
    }.property( 'type' )
} );

