import Ember from 'ember';

export default Ember.Controller.extend( {

    needs: [ 'application' ],

    itemCountsBinding: 'controllers.application.itemCounts'
} );