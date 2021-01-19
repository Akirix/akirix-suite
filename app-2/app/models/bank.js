import DS from 'ember-data';

export default DS.Model.extend( {
    name: DS.attr(),
    office_code: DS.attr(),
    servicing_FRB_number: DS.attr(),
    telephone: DS.attr(),
    record_type_code: DS.attr(),
    change_date: DS.attr(),
    new_routing_number: DS.attr(),
    address: DS.attr(),
    city: DS.attr(),
    state_code: DS.attr(),
    zip_code: DS.attr(),
    country: DS.attr(),
    data_view_code: DS.attr(),
    branch: DS.attr(),
    institution_status_code: DS.attr(),
    type: DS.attr(),
    created_at: DS.attr()
} );