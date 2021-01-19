import DS from 'ember-data';
import config from 'uber-app/config/environment';

export default DS.RESTSerializer.extend( {
    attrs: {
        node: { key: 'node_id', serialize: false },
        project: { key: 'project_id', serialize: false }
    }
} );