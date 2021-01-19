import { validatePresence, validateLength, validateInclusion } from 'ember-changeset-validations/validators';

export default {
    account_number: validatePresence( true ),
    type: [ validatePresence( true ), validateInclusion( { list: [ 0, 1, 2 ] } ) ],
    method: [ validatePresence( true ), validateInclusion( { list: [ 0, 1 ] } ) ],
    notes: validateLength( { max: 140, allowBlank: true } ),
    amount: '',
    account_id: validatePresence( true )
}