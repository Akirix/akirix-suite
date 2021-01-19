import { validateNumber, validatePresence } from 'ember-changeset-validations/validators';

export default {
    amount: validateNumber( { gt: 0, positive: true, allowBlank: false } ),
    invoice_id: validatePresence( true ),
    account_id: validatePresence( true )
}