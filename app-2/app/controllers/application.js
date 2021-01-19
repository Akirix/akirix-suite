import Ember from 'ember';

export default Ember.Controller.extend( {

    setCurrentRoute: function(){
        Ember.$( '[aria-describedby]' ).popover( 'hide' ); 
    }.observes( 'currentRouteName' )
} );