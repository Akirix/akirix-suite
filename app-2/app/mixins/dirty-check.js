import Ember from 'ember';

export default Ember.Mixin.create( {
    activate(){
        Ember.$( window ).on( 'beforeunload', ()=>{
            return null;
        } );
    },

    deactivate(){
        Ember.$( window ).off( 'beforeunload' );
    }
} );
