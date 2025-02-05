import { validateFormat, validatePresence } from 'ember-changeset-validations/validators';

export default {
    email: validateFormat( { type: 'email' } ),
    password: validatePresence( true )
}
