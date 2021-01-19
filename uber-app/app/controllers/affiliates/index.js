import Ember from 'ember';
import EmberValidations from 'ember-validations';
import pagedArray from 'ember-cli-pagination/computed/paged-array';

export default Ember.ArrayController.extend( {
    paneSecondary: 'companies/help-index',
    queryParams: [ 'page', 'perPage' ],
    page: 1,
    perPage: 25
} );