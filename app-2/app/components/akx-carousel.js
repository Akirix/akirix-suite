import Ember from 'ember';

export default Ember.Component.extend( {
    elementId: 'akx-carousel',
    classNames: [ 'carousel', 'slide' ],

    didInsertElement(){
        let ol = this.$( 'ol' );
        if( this.$( '.carousel-item' ).length > 1 ){
            this.$( '.carousel-item' ).each( ( index, value )=>{
                if( index === 0 ){
                    value.classList.add( 'active' );
                    ol.append( `<li data-target="#${this.get( 'elementId' )}" data-slide-to=${index} class="active"></li>` )
                }
                else {
                    ol.append( `<li data-target="#${this.get( 'elementId' )}" data-slide-to=${index}></li>` )
                }
            } );
        }
        else {
            this.$( '.carousel-item' ).first().addClass( 'active' );
        }
        this.$().carousel( { interval:false } );
    }
} );
