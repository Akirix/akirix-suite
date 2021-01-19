import { validatePresence, validateLength, validateNumber, validateFormat } from 'ember-changeset-validations/validators';
import invoiceValidator from 'akx-app/validators/invoices';

export default {
    account_id: invoiceValidator(),
    type: validatePresence( true ),
    title: validatePresence( true ),
    // Removing from now until we come up with a good max length
    // notes: validateLength( { max: 50 } ),
    invoiceItems: validateLength( { min: 1 } ),
    amount: validateNumber( { gt: 0, positive: true, allowBlank: false } ),
    account_number: invoiceValidator(),
    to_company_name: invoiceValidator(),
    to_company_email: [ invoiceValidator(), validateFormat( { type: 'email', allowBlank: true } ) ]
}
