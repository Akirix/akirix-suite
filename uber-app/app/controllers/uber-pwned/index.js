import Ember from 'ember';
import EmberValidations from 'ember-validations';
import pagedArray from 'ember-cli-pagination/computed/paged-array';

export default Ember.ArrayController.extend( {
    paneSecondary: 'uber-pwned/help',
    queryParams: [ 'page', 'perPage', 'user_id' ],
    page: 1,
    perPage: 25
} );