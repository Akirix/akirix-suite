import Ember from 'ember';
import EmberValidations from 'ember-validations';
import pagedArray from 'ember-cli-pagination/computed/paged-array';
import AdvancedSearch from 'uber-app/mixins/advanced-search-controller';


export default Ember.ArrayController.extend( AdvancedSearch, {
    queryParams: [ 'page', 'perPage', 'status', 'type', 'base_currency_id', 'base_amount', 'counter_currency_id', 'counter_amount', 'name', 'reference', 'period_from', 'period_to' ],
    page: 1,
    perPage: 50,
    type: null,
    base_currency_id: null,
    counter_currency_id: null,
    name: null,
    reference: null,
    status: null,
    base_amount: null,
    counter_amount: null,
    period_from: null,
    period_to: null,


    searchParams: [
        {
            label: 'FX ID',
            variable: 'name',
            input_type: 'text'
        },
        {
            label: 'Reference',
            variable: 'reference',
            input_type: 'text'
        },
        {
            label: 'FX Type',
            variable: 'type',
            input_type: 'dropdown',
            options: [
                { label: 'Select a type', val: null },
                { label: 'Outside FX', val: 0 },
                { label: 'Akirix FX', val: 1 }
            ]
        },
        {
            label: 'Base Currency',
            variable: 'base_currency_id',
            input_type: 'dropdown',
            options: [
                { label: 'Select a base currency', val: null },
                { label: 'USD', val: 'USD' },
                { label: 'EUR', val: "EUR" },
                { label: 'GBP', val: "GBP" }


            ]
        },
        {
            label: 'Base Amount',
            variable: 'base_amount',
            input_type: 'text'
        },
        {
            label: 'Counter Currency',
            variable: 'counter_currency_id',
            input_type: 'dropdown',
            options: [
                { label: 'Select a counter currency', val: null },
                { label: 'USD', val: 'USD' },
                { label: 'EUR', val: "EUR" },
                { label: 'GBP', val: "GBP" }


            ]
        },
        {
            label: 'Counter Amount',
            variable: 'counter_amount',
            input_type: 'text'
        },
        {
            label: 'Status',
            variable: 'status',
            input_type: 'dropdown',
            options: [
                { label: 'Select a status', val: null },
                { label: 'Pending', val: 0 },
                { label: 'Started', val: 1},
                { label: 'Completed', val: 2 },
                { label: 'Canceled', val: 3 },
                { label: 'On Hold', val: 4 }


            ]
        },
    ],
} );