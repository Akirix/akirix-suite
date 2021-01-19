import DS from 'ember-data';

export default DS.RESTSerializer.extend( {
    attrs: {
        company: { key: 'company_id', serialize: false },
        //currency: { key: 'currency_id', serialize: false }
    }
} );
