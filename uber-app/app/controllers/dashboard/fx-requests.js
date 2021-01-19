import Ember from 'ember';
import EmberValidations from 'ember-validations';
import pagedArray from 'ember-cli-pagination/computed/paged-array';
var locale = new Globalize( navigator.language );

export default Ember.ArrayController.extend( {
    paneSecondary: null,
    needs: [ 'application' ],

    hasNewRequests: function(){
        return this.get( 'model.length' ) > 0;
    }.property( 'model.length' ),

    actions: {

    }
} );