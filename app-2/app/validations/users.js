import { validateConfirmation } from 'ember-changeset-validations/validators';

export default {
    confirmation: validateConfirmation( { on: 'password' } )
}