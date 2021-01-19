import { validatePresence, validateInclusion } from 'ember-changeset-validations/validators';

export default {
    period_to: validatePresence( true ),
    period_from: validatePresence( true ),
    file_type: [ validatePresence( true ), validateInclusion( { list: [ 'csv' ] } ) ]
}