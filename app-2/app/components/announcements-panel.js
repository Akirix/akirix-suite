import Ember from 'ember';

export default Ember.Component.extend( {
    classNames: [ 'announcements' ],

    getCount: function(){
        this.set( 'hasMoreThanOne', this.get( 'announcements.length' ) > 1 );
        this.set( 'stringList', this.get( 'localeFile.announcements-panel' ) );
    }.on( 'init' ),

    getNotes: function(){
        if( this.get( 'hasMoreThanOne' ) ){
            return this.get( 'stringList.hasMoreThanOne' );
        }
        return this.get( 'announcements' ).objectAt( 0 ).get( 'notes' );
    }.property(),

    getName: function(){
        if( this.get( 'hasMoreThanOne' ) ){
            return this.get( 'stringList.multiple' );
        }
        return this.get( 'announcements' ).objectAt( 0 ).get( 'name' );
    }.property(),

    mouseEnter( e ){
        this.$().addClass( 'component-height' );
        e.stopPropagation();
    },
    mouseLeave( e ){
        this.$().removeClass( 'component-height' );
        e.stopPropagation();
    }
} );