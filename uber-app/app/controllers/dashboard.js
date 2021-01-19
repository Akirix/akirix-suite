import Ember from 'ember';
import EmberValidations from 'ember-validations';
import pagedArray from 'ember-cli-pagination/computed/paged-array';
import config from 'uber-app/config/environment';

export default Ember.Controller.extend( {

    needs: [ 'application' ],

    itemCountsBinding: 'controllers.application.itemCounts',

    pendingOutCount: function(){
        return this.get( 'itemCounts.wires.wireOut.new' ) + this.get( 'itemCounts.wireBatches.new' );
    }.property( 'itemCounts' )
} );