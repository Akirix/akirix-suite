import DS from 'ember-data';

export default DS.RESTSerializer.extend( {
    attrs: {
        company: { key: 'company_id', serialize: false },
        clientCompany: { key: 'client_company_id', serialize: false },
        account: { key: 'account_id', serialize: false },
        clientAccount: {key: 'client_account_id', serialize: false},
        wireInstruction: {key: 'wire_instruction_id', serialize: false},
    }
} );