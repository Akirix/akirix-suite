import { validatePresence, validateLength, validateInclusion, validateNumber } from 'ember-changeset-validations/validators';
import wireValidator from 'akx-app/validators/wires';

export default {
    amount: [ validateNumber( { gt: 0, positive: true, allowBlank: false } ) ],
    name: validateLength( { max: 30, allowBlank: true } ),
    bank_name: [ validatePresence( true ), validateLength( { max: 35 } ) ],
    bank_address: [ validatePresence( true ), validateLength( { max: 35, allowBlank: false } ) ],
    bank_city: [ validateLength( { max: 25, allowBlank: false } ), validatePresence( true ) ],
    bank_country: [ validateLength( { max: 2 } ), validatePresence( true ) ],
    bank_state_province: [ validateLength( { max: 35, allowBlank: true } ), wireValidator() ],
    bank_postal_code: [ validateLength( { max: 35, allowBlank: false } ), validatePresence( true ) ],
    bank_phone: validateLength( { max: 10, allowBlank: true } ),
    code_swift: [ validateLength( { min: 8, max: 11, allowBlank: true } ), wireValidator() ],
    code_aba: [ validateLength( { is: 9, allowBlank: true } ), wireValidator() ],
    account_holder: [ validatePresence( true ), validateLength( { max: 60 } ) ],
    account_holder_dob: [ validateLength( { max: 10, allowBlank: true } ), wireValidator() ],
    account_holder_address: [ validatePresence( true ), validateLength( { max: 35 } ) ],
    account_holder_city: [ validatePresence( true ), validateLength( { max: 25 } ) ],
    account_holder_state_province: [ validateLength( { max: 35, allowBlank: true } ), wireValidator() ],
    account_holder_postal_code: validateLength( { max: 9, allowBlank: true } ),
    account_holder_country: [ validatePresence( true ), validateLength( { max: 2 } ) ],
    account_holder_nationality: [ validateLength( { max: 10, allowBlank: true } ), wireValidator() ],
    account_number: [ validatePresence( true ), validateLength( { max: 34 } ) ],
    account_iban: [ validateLength( { max: 34, allowBlank: true } ), wireValidator() ],
    code_irc: validateLength( { max: 24, allowBlank: true } ),
    intermediary_bank_name: [ validateLength( { max: 35, allowBlank: true } ), wireValidator() ],
    intermediary_bank_address: validateLength( { max: 35, allowBlank: true } ),
    intermediary_bank_city: validateLength( { max: 25, allowBlank: true } ),
    intermediary_bank_country: [ wireValidator(), validateLength( { max: 2, allowBlank: true } ) ],
    intermediary_bank_state_province: [ validateLength( { max: 3, allowBlank: true } ), wireValidator() ],
    intermediary_bank_postal_code: validateLength( { max: 9, allowBlank: true } ),
    intermediary_bank_code_aba: [ validateLength( { is: 9, allowBlank: true } ), wireValidator() ],
    intermediary_bank_code_swift: [ validateLength( { min: 8, max: 11, allowBlank: true } ), wireValidator() ],
    intermediary_bank_code_irc: validateLength( { max: 24, allowBlank: true } ),
    type: [ validatePresence( true ), validateInclusion( { list: [ 0, 1, 2 ] } ) ],
    method: [ validatePresence( true ), validateInclusion( { list: [ 0, 1, 2 ] } ), wireValidator() ],
    speedwire: [ validatePresence( true ), validateInclusion( { list: [ false, true ] } ) ],
    notes: validateLength( { max: 140, allowBlank: true } ),
    notes_akirix: validateLength( { allowBlank: true } ),
    account_id: validatePresence( { presence: true, message: 'Please select an Account' } ),
    company_id: validatePresence( true ),
    currency_id: validatePresence( true ),
    purpose: [ validatePresence( true ), validateLength( { max: 210 } ) ],
    beneficiary_type: [ validateInclusion( { list: [ 0, 1 ], allowBlank: false } ) ],
    selected: validateInclusion( { list: [ true ], message: 'Please make selection' } ),
}
