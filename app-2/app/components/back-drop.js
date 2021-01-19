import Ember from 'ember';

export default Ember.Component.extend( {
    classNames: [ 'hide-stuff', 'fade', 'show' ],

    didInsertElement(){
        this.$().on('click', ()=>{
            Ember.$( '.card.active' ).removeClass( 'active' ).parent().removeClass( 'hover' );
            Ember.$( '.map' ).css( {
                top:'90px',
                left:0
            } );
            this.send( 'close' );
        } );
    },

    actions: {
        close( param ){
            let sidePanel = Ember.$( '#sidePanel' );
            sidePanel.animate( {
                right: `-${sidePanel.width()+20}px`
            } );
            if( !param ){
                let controller = this.get( 'controller' );
                controller.transitionToRoute( 'authenticated.projects.view' );
            }
            this.sendAction();
        }
    }
} );