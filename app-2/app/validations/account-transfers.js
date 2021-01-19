import { validatePresence } from 'ember-changeset-validations/validators';

export default {
    amount: "",
    account_id: validatePresence( true )
}