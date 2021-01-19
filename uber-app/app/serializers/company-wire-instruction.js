import DS from 'ember-data';
import config from 'uber-app/config/environment';

export default DS.RESTSerializer.extend( {
    attrs: {
        company: { key: 'company_id', serialize: false },
        wireInstruction: { key: 'wire_instruction_id', serialize: false }
    }
} );

