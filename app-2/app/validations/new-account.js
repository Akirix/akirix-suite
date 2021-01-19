import { validatePresence } from 'ember-changeset-validations/validators';

export default {
    currency_type: [ validatePresence( true ) ],
    purpose: validatePresence( true ),
    volume_in: validatePresence( true ),
    volume_in_frequency: validatePresence( true ),
    volume_out: validatePresence( true ),
    volume_out_frequency: validatePresence( true ),
    average_balance: validatePresence( true )
}
