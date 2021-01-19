import Ember from 'ember';
import filterDefaults from 'akx-app/mixins/filter-defaults';

export default Ember.Controller.extend( filterDefaults, {
    sortProperties: [ 'created_at:desc' ],
    sortTransactions: Ember.computed.sort( 'model', 'sortProperties' )
} );
