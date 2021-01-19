import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( {
    paneSecondary: null,
    needs: [ 'application' ],
    sortProperties: [ 'created_at' ],
    sortAscending: false,

    actions: {
    }
} );
