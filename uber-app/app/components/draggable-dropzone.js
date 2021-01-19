import Ember from 'ember';

export default Ember.Component.extend( {
    classNameBindings: [ 'dragClass' ],
    dragClass: 'deactivated',
    store: Ember.inject.service(),

    dragLeave: function( event ){
        event.preventDefault();
        this.set( 'dragClass', 'deactivated' );
    },

    dragOver: function( event ){
        event.preventDefault();
        this.set( 'dragClass', 'activated' );
    },

    drop: function( event ){
        var store = this.get( 'store' );
        var self = this;
        var data = event.dataTransfer.getData( 'text/data' );
        store.find( 'wire', data ).then( function( wire ){
            self.set( 'wire', wire );
            self.sendAction( 'dropped', self.get( 'wire' ), self.get( 'content' ) );
            self.set( 'dragClass', 'deactivated' );
        } );
    },

    click: function(){
        this.sendAction( 'action', this.get( 'content' ) );
        this.$().addClass( 'active' ).siblings().removeClass( 'active' );
    }
} );