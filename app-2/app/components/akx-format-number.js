import Ember from 'ember';

export default Ember.TextField.extend( {
  attributeBindings: [ 'name' ],
  scale: 2,
  placeholder: '0.00',

	keyUp(){
        var numberValue = Number( this.get( 'value' ).replace( /,/g, '' ) );
        if( !isNaN( numberValue ) ){
            let input = this.get( 'value' ).replace( /,/g, '' );
            let parts = input.split( '.' );
            let part1 = parts[ 0 ].replace( /(\d)(?=(\d\d\d)+(?!\d))/g, "$1," );
            let scale = this.get( 'scale' );
            if( parts.length > 1 ){
                if( parts[ 1 ].length > scale ){
                    this.set( 'value', `${part1}.${parts[ 1 ].substring( 0, scale )}` );
                }
                else{
                    this.set( 'value', `${part1}.${parts[ 1 ]}` );
                }
            }
            else{
                this.set( 'value', part1 );
            }
            this.set( 'realValue', numberValue );
        }
        else{
            this.set( 'value', this.get( 'value' ).slice( 0, -1 ) );
        }
    },

    didInsertElement(){
        if( this.get( 'realValue' ) > 0 ){
            this.set( 'value', this.get( 'realValue' ).toString() );
            // Had to add this for material bootstrap floating label
            // this.$().parent().addClass( 'is-filled' );
        }
    },

    click(){
        let l = this.$().val().length * 2;
        this.element.setSelectionRange( l, l );
    }
} );
