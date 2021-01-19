import Ember from 'ember';
import EmberValidations from 'ember-validations';
import pagedArray from 'ember-cli-pagination/computed/paged-array';

export default Ember.Controller.extend( {
    needs: [ 'companies/view/users/view' ],
    //userBinding: 'controllers.companies/view/users/view.model',

    hasPwned: function(){
        return this.get( 'model' );
    }.property( 'model' ),

    actions: {
    }
} );
