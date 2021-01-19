import Ember from 'ember';

export default Ember.Component.extend( {
    tagName: 'i',
    classNames: [ 'fa' ],
    classNameBindings: [ 'isCollapsed' ],

    isCollapsed: 'fa-chevron-right',

    click: function( event ){
        event.stopPropagation();
        if( this.get( 'isCollapsed' ) === 'fa-chevron-right' ){
            this.set( 'isCollapsed', 'fa-chevron-down' );
        }
        else{
            this.set( 'isCollapsed', 'fa-chevron-right' );
        }
        this.sendAction( 'action', this.get( 'content' ) );
    }
} );