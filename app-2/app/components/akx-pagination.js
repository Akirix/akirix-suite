import Ember from 'ember';

export default Ember.Component.extend( {
    tagName: 'nav',
    list: [],
    
    getStringList: function(){
        this.set( 'stringList', this.get( 'localeFile.akx-pagination' ) );
        this.setList( 0, 0 );
    }.on( 'init' ),

    hasMorePages: function(){
        return this.get( 'page' ) < Number( this.get( 'meta.total_pages' ) );
    }.property( 'page', 'meta.total_pages' ),

    canStepBackward: function(){
        return this.get( 'page' ) !== 1;
    }.property( 'page' ),

    watchPage: function(){
        if( this.get( 'list' ).objectAt( 9 ) === this.get( 'page' ) ){
            let page = this.get( 'page' );
            this.setList( ( page - 5 ), page );
        }
    }.observes( 'page' ),

    setList( i, page ){
        let total = Number( this.get( 'meta.total_pages' ) );
        if( total >= i ){
            let res = this.get( 'list' ).slice( 5 );
            let smaller = Math.min( total, ( i + 10 ) );
            let addNumbers = page + 1;
            while( addNumbers <= smaller ) {
                res.push( addNumbers )
                addNumbers++;
            }
            this.set( 'list', res );
        }
    },

    actions: {
        next(){
            if( this.get( 'hasMorePages' ) ){
                this.incrementProperty( 'page' );
                this.sendAction();
            }
        },
        back(){
            if( this.get( 'canStepBackward' ) ){
                this.decrementProperty( 'page' );
                this.sendAction();
            }
        },
        setPage( idx ){
            this.set( 'page', idx );
            this.sendAction();
        }
    }
} );