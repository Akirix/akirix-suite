import DS from 'ember-data';
import config from 'uber-app/config/environment';

export default DS.RESTSerializer.extend( {
    attrs: {
        company: { key: 'company_id', serialize: false },
        currency: { key: 'currency_id', serialize: false },
        fund: { key: 'fund_id', serialize: false }
    }
} );

