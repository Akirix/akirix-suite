import DS from 'ember-data';
import config from 'uber-app/config/environment';

export default DS.RESTSerializer.extend( {
    attrs: {
        currency: { key: 'currency_id', serialize: false },
        fromAccount: { key: 'from_account_id', serialize: false },
        toAccount: { key: 'to_account_id', serialize: false }
    }
} );
