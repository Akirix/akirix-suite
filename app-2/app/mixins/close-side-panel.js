import Ember from 'ember';

export default Ember.Mixin.create( {
    deactivate(){
        this.send( 'closeSidePanel', true );
    }
} );