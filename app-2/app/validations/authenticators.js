import { validatePresence, validateInclusion } from 'ember-changeset-validations/validators';

export default {
    name: validatePresence( true ),
    type: [ validatePresence( true ), validateInclusion( { list: [ 0, 1, 2, 3 ] } ) ]
}