import { validatePresence } from 'ember-changeset-validations/validators';

export default {
    notes: validatePresence( true )
}