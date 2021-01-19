import DS from 'ember-data';

export default DS.RESTSerializer.extend( {
    attrs: {
        node: { key: 'node_id', serialize: false },
        project: { key: 'project_id', serialize: false }
    }
} );

