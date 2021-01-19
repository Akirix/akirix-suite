import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.ArrayController.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],
    sortProperties: [ 'created_at' ],
    sortAscending: false,
    page: 1,
    perPage: 50
} );