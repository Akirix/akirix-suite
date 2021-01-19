import DS from 'ember-data';
import config from 'uber-app/config/environment';

export default DS.RESTSerializer.extend( {
    attrs: {
        currency: { key: 'currency_id', serialize: false },
        affiliate: { key: 'affiliate_id', serialize: false },
        uberUser: { key: 'uber_user_id', serialize: false }
    }
} );
