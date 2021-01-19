import Ember from 'ember';

export default Ember.Component.extend( {
    tagName: 'tbody',
    attributeBindings: [ 'name' ],

    didInsertElement(){
        if( this.get( 'value' ) ){
            this.$( `#${this.get( 'value' )}` ).addClass( 'chosen' );
        }
    },
    
    click( e ){
        Ember.$( '.chosen' ).removeClass( 'chosen' );
        this.$( e.target ).parent().addClass( 'chosen' );
    },

    actions: {
        selected( id ){
            this.set( 'value', id );
            if( this.get( 'next' ) ){
                this.get( 'next' )();
            }
        }
    }
} );
