import DS from 'ember-data';

export default DS.RESTSerializer.extend( {
    attrs: {
        user: { key: 'user_id', serialize: false }
    }
} );