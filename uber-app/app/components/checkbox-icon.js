import Ember from 'ember';

export default Ember.Component.extend( {
    tagName: 'i',
    classNames: [ 'fa' ],
    classNameBindings: [ 'isVerified' ],

    isVerified: 'fa-square-o',

    click: function( event ){
        event.stopPropagation();
        var isVerified = this.get( 'isVerified' );
        if( isVerified === 'fa-square-o' ){
            this.set( 'isVerified', 'fa-check-square-o' );
        }
        else{
            this.set( 'isVerified', 'fa-square-o' );
        }
    }
} );