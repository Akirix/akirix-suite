import Ember from 'ember';
import EmberValidations from 'ember-validations';
import AdvancedSearch from 'uber-app/mixins/advanced-search-controller';

export default Ember.ArrayController.extend( EmberValidations.Mixin, AdvancedSearch, {
    needs: [ 'application' ],

    page: 1,
    perPage: 50,
    queryParams: [ 'wire_instruction_id', 'page', 'perPage' ],
    company_id: null,
    wire_instruction_id: null,
    searchParams:[]

} );
