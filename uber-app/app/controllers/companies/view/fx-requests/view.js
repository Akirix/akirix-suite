import Ember from 'ember';
import EmberValidations from 'ember-validations';
var locale = new Globalize( navigator.language );

export default Ember.Controller.extend( EmberValidations.Mixin,{
    needs: [ 'application' ],

    validations: {
        'data.base_amount': {
            presence: true,
            numericality: {
                greaterThanOrEqualTo: 0
            }

        },
        'data.counter_currency_id': {
            presence: true,
            length: 3
        },
        'data.from_account_id': {
            presence: true
        },
        'fromAccount.currency_id': {
            presence: true,
            length: 3
        },

    },

    actions: {
    }
} );