import Ember from 'ember';
import EmberValidations from 'ember-validations';
import pagedArray from 'ember-cli-pagination/computed/paged-array';
import AdvancedSearch from 'uber-app/mixins/advanced-search-controller';


export default Ember.ArrayController.extend( AdvancedSearch, {
    queryParams: [ 'type', 'deterministic' ],

} );