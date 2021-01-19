import DS from 'ember-data';

export default DS.RESTSerializer.extend( {
    attrs: {
        company: { key: 'company_id', serialize: false },
        node: { key: 'node_id', serialize: false },
        project: { key: 'project_id', serialize: false },
        toCompany: { key: 'to_company_id', serialize: false }
    }
} );