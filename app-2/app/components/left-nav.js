import Ember from 'ember';

export default Ember.Component.extend( {
    tagName: 'nav',
    classNames: [ 'left-nav' ],
    attributeBindings: [ 'role' ],
    role: 'navigation',
    session: Ember.inject.service( 'session' ),

    getStringList: function(){
        let stringList = this.get( 'localeFile.left-nav' );
        let accessList = this.get( 'accessList' );
        let routes = Object.keys( accessList );
        this.set( 'routes', routes.reduce( ( acc, key )=>{
            accessList[ key ][ 'label' ] = stringList[ key ];
            if( !Ember.isEmpty( accessList[ key ][ 'subRoutes' ] ) ){
                accessList[ key ][ 'subRoutes' ].forEach( ( subRoute )=>{
                    subRoute[ 'label' ] = stringList[ subRoute.id ];
                } );
            }
            return acc.concat([accessList[ key ]]);
        }, [] ) );
    }.on( 'init' ),

    didInsertElement(){
        this.$( '.nav-item' ).each( function(){
            this.addEventListener( 'mouseenter', ()=>{
                if( !Ember.isEmpty( this.attributes[ 'data-original-title' ] ) ){
                    if( Ember.$( '.popover' ).length <= 1 ){
                        Ember.$( '.popover' ).last().popover( 'hide' );    
                    }
                    Ember.$( this ).popover( 'show' );
                }
                else {
                    Ember.$( '.popover' ).popover( 'hide' );
                }
            } );
        } );
    }
} );