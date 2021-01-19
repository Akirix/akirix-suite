import Ember from 'ember';

export default Ember.Component.extend( {
    classNames: [ 'rotating-card-container' ],
    classNameBindings: [ 'manual-flip' ],

    didInsertElement(){
        let self = this;

        this.$( '.akx-button' ).each( function(){
            self.clickFunc( this );
        } );
        this.$( '.akx-create-invoice' ).each( function(){
            self.clickFunc( this );
        } );
        this.$( '.act' ).each( function(){
            self.clickFunc( this );
        } );
        this.$( 'li' ).each( function(){
            self.clickFunc( this );
        } );

        if( !Ember.isEmpty( this.$().find( '.active' ) ) ){
            this.$().find( '.card' ).addClass( 'active' );
            this.$().addClass( 'hover' );
            this.animate();
        }
    },

    clickFunc( el ){
        let self = this;
        el.addEventListener( 'click', function(){
            if( !self.$( '.card' ).hasClass( 'active' ) ){
                self.$( '.card' ).addClass( 'active' );
                self.$().addClass( 'hover' );
                self.animate();
            }
        } );
    },

    animate(){
        let obj = {}
        if( this.$( window ).width() > 1195 ){

            obj[ 'left' ] = -(this.$().offset().left  - 200 )

            if( this.get( 'buyer' ) ){
                obj['top'] = this.$().offset().top + 90;
            }
            else{
                obj['top'] = -(this.$().offset().top - 500);
            }
        }
        else{
            obj[ 'width' ] = '50%';
        }
        Ember.$('.map').css( obj );
    }
} );