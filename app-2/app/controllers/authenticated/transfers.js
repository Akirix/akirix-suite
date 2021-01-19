import Ember from 'ember';
import filterDefaults from 'akx-app/mixins/filter-defaults';

export default Ember.Controller.extend( filterDefaults, {
    sortProperties: [ 'updated_at:desc' ],
    sortWires: Ember.computed.sort( 'model', 'sortProperties' ),

    showResults: function(){
        return !Ember.isEmpty( this.get( 'model' ) ) || !Ember.isEmpty( this.get( 'query' ) );
    }.property( 'model' )
} );
