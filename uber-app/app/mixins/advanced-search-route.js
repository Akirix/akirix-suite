import Ember from 'ember';

export default Ember.Mixin.create( {
    actions: {
        refresh: function(){
            this.refresh();
        }
    }
} );