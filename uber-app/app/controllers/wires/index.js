import Ember from 'ember';
import EmberValidations from 'ember-validations';
import AdvancedSearch from 'uber-app/mixins/advanced-search-controller';

export default Ember.ArrayController.extend( EmberValidations.Mixin, AdvancedSearch, {
    needs: [ 'application' ],

    queryParams: [ 'page', 'perPage', 'type', 'method', 'currency_id', 'name', 'account_holder', 'reference', 'bank_name', 'bank_country', 'status', 'amount_min', 'amount_max', 'period_from', 'period_to', 'bank_route_id' ],
    page: 1,
    perPage: 50,
    type: null,
    method: null,
    currency_id: null,
    name: null,
    account_holder: null,
    reference: null,
    bank_name: null,
    bank_route_id: null,
    status: null,
    amount_min: null,
    amount_max: null,
    period_from: null,
    period_to: null,
    bank_country: null,

    searchParams: Ember.A( [
        {
            label: 'Wire ID',
            variable: 'name',
            input_type: 'text'
        },
        {
            label: 'Beneficiary Name',
            variable: 'account_holder',
            input_type: 'text'
        },
        {
            label: 'Reference',
            variable: 'reference',
            input_type: 'text'
        },
        {
            label: 'Wire Type',
            variable: 'type',
            input_type: 'dropdown',
            options: [
                { label: 'Select a type', val: null },
                { label: 'Out', val: 0 },
                { label: 'In', val: 1 },
                { label: 'Internal', val: 2 }
            ]
        },
        {
            label: 'Currency',
            variable: 'currency_id',
            input_type: 'dropdown',
            options: [
                { label: 'Select a currency', val: null },
                { label: 'USD', val: 'USD' },
                { label: 'EUR', val: "EUR" },
                { label: 'GBP', val: "GBP" }


            ]
        },
        {
            label: 'Minimum Amount',
            variable: 'amount_min',
            input_type: 'text'
        },
        {
            label: 'Maximum Amount',
            variable: 'amount_max',
            input_type: 'text'
        },
        {
            label: 'Wire Method',
            variable: 'method',
            input_type: 'dropdown',
            options: [
                { label: 'Select a method', val: null },
                { label: 'Wire', val: 0 },
                { label: 'ACH', val: 1 },
                { label: 'Internal', val: 2 }
            ]
        },
        {
            label: 'Wire Status',
            variable: 'status',
            input_type: 'dropdown',
            options: [
                { label: 'Select a status', val: null },
                { label: 'Pending', val: 0 },
                { label: 'Started', val: 1 },
                { label: 'Completed', val: 2 },
                { label: 'Cancelled', val: 3 },
                { label: 'On Hold', val: 4 },
                { label: 'Rejected', val: 5 },
                { label: 'On Hold/ DD not Satisfied', val: 6 },
                { label: 'ACH Recalled', val: 7 }
            ]
        },
        {
            label: 'Bank Name',
            variable: 'bank_name',
            input_type: 'text'
        },
        {
            label: 'Bank Country',
            variable: 'bank_country',
            input_type: 'dropdown',
            options: []
        },
        {
            label: 'Bank Route',
            variable: 'bank_route_id',
            input_type: 'dropdown',
            options: [] 
        }
    ] )
} );
