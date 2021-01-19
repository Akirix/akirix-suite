import Ember from 'ember';
import AdvancedSearch from 'uber-app/mixins/advanced-search-controller';

export default Ember.ArrayController.extend( AdvancedSearch, {
    paneSecondary: null,
    queryParams: [ 'page', 'perPage', 'type', 'amount', 'period_from', 'period_to' ],
    page: 1,
    perPage: 50,
    type: null,
    amount: null,
    period_from: null,
    period_to: null,

    searchParams: [
        {
            label: 'Transaction Type',
            variable: 'type',
            input_type: 'dropdown',
            options: [
                { label: 'Select a type', val: null },
                { label: 'Invoice', val: 1 },
                { label: 'Fee', val: 3 },
                { label: 'Wire', val: 4 },
                { label: 'Transfer', val: 5 },
                { label: 'FX', val: 9 },
                { label: 'Commission Payment', val: 8 }
            ]
        },
        {
            label: 'Amount',
            variable: 'amount',
            input_type: 'text'
        }
    ],
} );
