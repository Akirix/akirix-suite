import DS from 'ember-data';
import config from 'uber-app/config/environment';

export default DS.RESTSerializer.extend( {
    attrs: {
        company: { key: 'company_id', serialize: false },
        account: { key: 'account_id', serialize: false },
        currency: { key: 'currency_id', serialize: false },
        wireBatch: { key: 'wire_batch_id', serialize: false },
        bankRoute: { key: 'bank_route_id', serialize: false }
    }
} );

