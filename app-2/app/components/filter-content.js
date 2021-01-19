import Ember from 'ember';

export default Ember.Component.extend( {

    willDestroy() {
        this._super();
        Ember.run.cancel( this.get( 'debounceFilter' ) );
    },

    setItems: function(){
        this.filter();
    }.on( 'init' ),

    getProperties: function() {
        return Ember.isEmpty( this.get( 'properties' ) ) ? Object.keys( this.get( 'model' ).objectAt( 0 ) ) : this.get( 'properties' );
    }.property( 'properties' ),

    normalizedQuery: function() {
        let query = this.get( 'query' );
        return Ember.isPresent( query ) ? query.replace( /\\+/g, '' ) : '';
    }.property( 'query' ),

    setDebounceForFilter: function() {
        this.set( 'debounceFilter', Ember.run.debounce( this, this.filter, 500, false ) );
    }.observes( 'query', 'model' ),

    filter() {
        const props = this.get( 'getProperties' );
        const query = this.get( 'normalizedQuery' );
        const model = this.get( 'model' );
        let allMatches = [];

        if( query !== '' ){
            props.forEach( ( prop )=>{
                let matches = model.filter( ( item )=>{
                    return this.aEqualB( item.get( prop ), query );
                } );
                allMatches = allMatches.concat( matches );
            } );
            this.set( 'items', allMatches );
        }
        else{
            this.set( 'items', this.get( 'model' ) );
        }
    },

    aEqualB( a, b ) {
        let matched = false;
        const matchTypes = [ 'number', 'string' ];

        if ( matchTypes.indexOf( Ember.typeOf( a ) ) !== -1 && matchTypes.indexOf( Ember.typeOf( b ) ) !== -1 ) {
            matched =  a.toLowerCase().match( b.toLowerCase() ) !== null;
        }
        return matched;
    }
} );