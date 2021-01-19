import { validatePresence, validateLength, validateNumber } from 'ember-changeset-validations/validators';

export default {
    tax_rate: validatePresence( true ),
    invoice_period_to: validatePresence( true ),
    invoice_period_from: validatePresence( true ),
    invoiceItems: validateLength( { min: 1 } ),
    amount: validateNumber( { gt: 0, positive: true, allowBlank: false } )
};