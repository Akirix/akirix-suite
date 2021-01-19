import { validatePresence, validateInclusion, validateNumber } from 'ember-changeset-validations/validators';

export default {
    type: [ validatePresence( true ), validateInclusion( { list: [ 0, 1, 2 ] } ) ],
    account_id: validatePresence( true ),
    currency_id: validatePresence( true ),
    akx_agreement: validatePresence( true ),
    akx_terms: validatePresence( true ),
    discount_rate: [ validateNumber( { gte: 0, lte: 100, positive: true, allowBlank: true } ) ],
    invoice_deadline: [ validateNumber( { gte: 0, lte: 100, positive: true, allowBlank: true } ) ]
};