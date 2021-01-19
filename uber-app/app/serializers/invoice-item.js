import DS from 'ember-data';
import config from 'uber-app/config/environment';

export default DS.RESTSerializer.extend( {
    attrs: {
        invoice: { key: 'invoice_id', serialize: false }
    }
} );