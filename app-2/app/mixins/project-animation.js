import Ember from 'ember';

export default Ember.Mixin.create( {
    actions: {
        closeSidePanel(){
            Ember.$( '.card.active' ).removeClass( 'active' ).parent().removeClass( 'hover' )
            Ember.$( '.hide-stuff' ).removeClass( 'show' );
            Ember.$( '.map' ).css( {
                top:'90px',
                left:0
            } );
            return true;
        },
    }
} );