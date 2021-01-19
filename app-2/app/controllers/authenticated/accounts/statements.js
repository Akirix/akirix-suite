import Ember from 'ember';

export default Ember.Controller.extend( {

    noStatements: function(){
        return Ember.isEmpty( this.get( 'model' ) );
    }.property( 'model' )
} );