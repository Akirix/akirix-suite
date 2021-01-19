import DS from 'ember-data';

export default DS.RESTSerializer.extend( {
    attrs: {
        company: { key: 'company_id', serialize: false },
        baseCurrency: { key: 'base_currency_id', serialize: false },
        counterCurrency: { key: 'counter_currency_id', serialize: false },
        fromAccount: { key: 'from_account_id', serialize: false },
        toAccount: { key: 'to_account_id', serialize: false }
    }
} );