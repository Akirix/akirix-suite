import Ember from 'ember';
import EmberValidations from 'ember-validations';
import AdvancedSearch from 'uber-app/mixins/advanced-search-controller';
var locale = new Globalize( navigator.language );

export default Ember.Controller.extend( EmberValidations.Mixin, AdvancedSearch, {
    needs: [ 'application' ],
    
    queryParams: [ 'page', 'perPage', 'wire_instruction_id', 'status' ],
    page: 1,
    perPage: 50,
    wire_instruction_id: null,
    status: null,
    
    searchParams: [
    	{
            label: 'Bank',
            variable: 'wire_instruction_id',
            input_type: 'dropdown',
            options: []
        },
        {
            label: 'Preferred Account Status',
            variable: 'status',
            input_type: 'dropdown',
            options: [
                { label: 'Select a status', val: null },
                { label: 'Active', val: 1 },
                { label: 'Inactive', val: 0 }
            ]
        }
    ],
} );