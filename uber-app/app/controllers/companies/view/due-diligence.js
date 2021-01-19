import Ember from 'ember';
import EmberValidations from 'ember-validations';
import pagedArray from 'ember-cli-pagination/computed/paged-array';

export default Ember.ArrayController.extend( {
    paneSecondary: null,

    dueDiligencesSort: [ 'status:asc', 'updated_at:desc' ],
    sortedDueDiligences: Ember.computed.sort( 'model', 'dueDiligencesSort' ),

    actions: {}

} );
