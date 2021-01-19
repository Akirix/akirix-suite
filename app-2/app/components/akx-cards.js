import Ember from 'ember';

export default Ember.Component.extend( {
    classNames: [ 'card' ],
// Maybe switch the classes
    mouseEnter(){
        if( !this.$().hasClass( 'chosen' ) ){
            this.$().toggleClass( 'active' );
        }
    },

    mouseLeave(){
        if( !this.$().hasClass( 'chosen' ) ){
            this.$().toggleClass( 'active' );
        }
    },

    click(){
        Ember.$( '.chosen' ).removeClass( 'chosen' );
        this.$().addClass( 'chosen' )
    }
} );