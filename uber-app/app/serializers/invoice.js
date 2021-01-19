import DS from 'ember-data';
import config from 'uber-app/config/environment';

export default DS.RESTSerializer.extend( {
    attrs: {
        company: { key: 'company_id', serialize: false },
        project: { key: 'project_id', serialize: false },
        currency: { key: 'currency_id', serialize: false },
        node: { key: 'node_id', serialize: false }
    }
} );