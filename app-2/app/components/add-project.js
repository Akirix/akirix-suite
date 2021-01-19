import Ember from 'ember';

export default Ember.Component.extend( {
    classNames: [ '' ],

    didInsertElement(){
        let self = this;
        this.$( '.dark-blue' ).each( function(){
            this.addEventListener('click', function(){
                if( Ember.isEmpty( Ember.$( '.show' ) ) ){
                    Ember.$( '.hide-stuff' ).addClass( 'show' );
                    self.animate();
                }
            } );
        } );

        if( !Ember.isEmpty( this.$().find( '.active' ) ) ){
            this.animate();
            Ember.$( '.hide-stuff' ).addClass( 'show' );
        }
    },

    animate(){
        let obj = {}
        if( this.$( window ).width() > 1195 ){
            obj[ 'left' ] = -(this.$().offset().left - 300 );
            obj['top'] = -(this.$().offset().top - 500);
        }
        else{
            obj[ 'width' ] = '50%';
        }
        Ember.$('.map').css( obj );
    }
} );