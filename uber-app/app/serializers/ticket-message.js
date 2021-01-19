import DS from 'ember-data';
import config from 'uber-app/config/environment';

export default DS.RESTSerializer.extend( {
    attrs: {
        user: { key: 'user_id', serialize: false },
        uberUser: { key: 'uber_user_id', serialize: false },
        ticket: { key: 'ticket_id', serialize: false }
    }
} );
