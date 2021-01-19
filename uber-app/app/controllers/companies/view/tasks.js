import Ember from 'ember';
import EmberValidations from 'ember-validations';
import pagedArray from 'ember-cli-pagination/computed/paged-array';

export default Ember.ArrayController.extend( {
    paneSecondary: null,

    tasksSort: [ 'status:asc', 'updated_at:desc', 'due_date:asc' ],
    sortedTasks: Ember.computed.sort( 'model', 'tasksSort' ),

    actions: {}

} );
