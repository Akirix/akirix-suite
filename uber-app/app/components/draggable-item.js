import Ember from 'ember';

export default Ember.Component.extend( {
    attributeBindings: [ 'draggableOpt:draggable' ],

    draggable: 'true',
    draggableOpt: false,

    dragStart: function( event ){
        return event.dataTransfer.setData( 'text/data', this.get( 'content.id' ) );
    },

    click: function(){
        this.sendAction( 'action', this.get( 'content.id' ) );
        this.$().addClass( 'active' ).siblings().removeClass( 'active' );
    }

} );