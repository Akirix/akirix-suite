import Ember from 'ember';

export default Ember.ArrayController.extend( {
    needs: [ 'application' ],
    paneSecondary: 'companies/wire-templates/help-index',
    sortProperties: [ 'account_holder' ],
    sortAscending: true
} );

