import Ember from 'ember';
import EmberValidations from 'ember-validations';
import pagedArray from 'ember-cli-pagination/computed/paged-array';

export default Ember.ArrayController.extend( {
    paneSecondary: null,
    queryParams: [ 'page', 'perPage', 'start_date', 'end_date' ],
    page: 1,
    perPage: 50
} );
