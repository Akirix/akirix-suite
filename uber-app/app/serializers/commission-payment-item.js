import DS from 'ember-data';
import config from 'uber-app/config/environment';

export default DS.RESTSerializer.extend( {
    attrs: {
        affiliate: { key: 'affiliate_id', serialize: false },
        currency: { key: 'currency_id', serialize: false },
        company: { key: 'company_id', serialize: false },
        commission_payment: { key: 'commission_payment_id', serialize: false }
    }
} );
