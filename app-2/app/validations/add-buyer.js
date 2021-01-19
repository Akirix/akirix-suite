import { validatePresence } from 'ember-changeset-validations/validators';

export default {
    account_number: validatePresence( true ),
    discount_rate: []
}