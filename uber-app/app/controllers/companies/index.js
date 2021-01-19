import Ember from 'ember';
import EmberValidations from 'ember-validations';
import AdvancedSearch from 'uber-app/mixins/advanced-search-controller';

export default Ember.ArrayController.extend( AdvancedSearch, {
	needs: [ 'application' ],
    paneSecondary: 'companies/help-index',
    
    queryParams: [ 'page', 'perPage', 'status', 'country' ],
    page: 1,
    perPage: 50,
    type: null,
    status: null,
    country: null,
    
    searchParams: [
        {
            label: 'Company Status',
            variable: 'status',
            input_type: 'dropdown',
            options: [
                { label: 'Select a type', val: null },
                { label: 'Active', val: 1 },
                { label: 'Closed', val: 0 },
                { label: 'Suspended', val: 2 }
            ]
        },
        {
            label: 'Country',
            variable: 'country',
            input_type: 'dropdown',
            options: []
        }
    ]
} );