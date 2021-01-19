import DS from 'ember-data';
import config from 'uber-app/config/environment';

export default DS.RESTSerializer.extend( {
    attrs: {
        account: { key: 'account_id', serialize: false },
        company: { key: 'company_id', serialize: false },
        investor: { key: 'investor_id', serialize: false },
        currency: { key: 'currency_id', serialize: false }

    }
} );