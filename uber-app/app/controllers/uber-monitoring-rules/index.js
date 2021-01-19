import Ember from 'ember';
import pagedArray from 'ember-cli-pagination/computed/paged-array';

export default Ember.ArrayController.extend( {
    queryParams: [ 'page', 'perPage', 'status' ],
    page: 1,
    perPage: 25,
    currentPage: 0,
    totalPages: 0,

} );

