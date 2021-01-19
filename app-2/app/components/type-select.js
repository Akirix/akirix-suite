import Ember from 'ember';

export default Ember.Component.extend( {
    tagName: 'div',
    classNames: [ 'type-option' ],
    attributeBindings: [ 'name' ],

    didInsertElement(){
        if( this.get( 'value' ) === this.get( 'type' ) ){
            this.$().addClass( 'chosen' );
        }
    },

    click(){
        // Future note: Add it as attr like step-group so css can add the styling instead of JS
        if( this.get( 'type' ) !== undefined ){
            this.set( 'value', this.get( 'type' ) );
        }
        Ember.$( '.chosen' ).removeClass( 'chosen' );
        this.$().addClass( 'chosen' );
        if( this.get( 'next' ) ){
            this.get( 'next' )();
        }
    }
} );