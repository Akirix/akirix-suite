import DS from 'ember-data';
import config from 'uber-app/config/environment';

export default DS.RESTSerializer.extend( {
    attrs: {
        bankRoute: { key: 'bank_route_id', serialize: false }
    }
} );

