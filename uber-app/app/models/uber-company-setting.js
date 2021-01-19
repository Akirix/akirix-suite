import DS from 'ember-data';

export default DS.Model.extend( {
    created_at: DS.attr(),
    updated_at: DS.attr(),
    company_id: DS.attr(),
    registration_id: DS.attr()
} );

