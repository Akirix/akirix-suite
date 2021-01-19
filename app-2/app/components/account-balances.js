import Ember from 'ember';

export default Ember.Component.extend( {
    tagName: 'li',
    classNames: [ 'balances' ],
    showPopover: true,

    mouseEnter(){
        this.$().popover( 'show' );
    },

    mouseLeave(){
        this.$().popover( 'hide' );
    },

    watchAccount: function(){
        if( this.get( 'showPopover' ) ){
            this.$().popover( 'dispose' );
            this.set( 'showPopover', false );
            Ember.run.later( ()=>{
                this.set( 'showPopover', true );
            }, 500 );
        }
    }.observes( 'account.pending_out', 'account.points_out' )
} );