import Ember from 'ember';
import pagedArray from 'ember-cli-pagination/computed/paged-array';

export default Ember.Controller.extend( {
    needs: [ 'application' ],
    searchValueBinding: 'controllers.application.searchValue',
    queryParams: [ 'page', 'perPage' ],
    page: 1,
    perPage: 25
} );
