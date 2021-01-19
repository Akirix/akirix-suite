import Ember from 'ember';

export default Ember.Component.extend( {
    showDateRange: true,

    actions: {
        search: function(){
            var controller = this.get( 'parentController' );
            controller.send( 'refresh' );
        },

        clearSearch: function(){
            var controller = this.get( 'parentController' );
            controller.send( 'clearQueryParams' );
        }
    }
} );