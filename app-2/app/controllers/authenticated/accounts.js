import Ember from 'ember';

export default Ember.Controller.extend( {
    sortProperties: [ 'created_at:asc' ],
    sortAccounts: Ember.computed.sort( 'model.accounts', 'sortProperties' )
} );