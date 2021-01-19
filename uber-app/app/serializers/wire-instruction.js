import DS from 'ember-data';

export default DS.RESTSerializer.extend( {
    attrs: {
        currency: { key: 'currency_id', serialize: false }
    }
} );
