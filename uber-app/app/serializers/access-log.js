import DS from 'ember-data';
import config from 'uber-app/config/environment';

export default DS.RESTSerializer.extend( {
    attrs: {
        user: { key: 'user_id', serialize: false }
    }
} );


