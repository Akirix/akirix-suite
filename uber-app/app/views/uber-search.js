import Ember from 'ember';

export default Ember.View.extend( {
    searchValue: null,
    classNames: 'search',
    templateName: 'views/uber-search',
    inputClass: 'form-control',
    inputPlaceholder: 'Search',

    keyDown: function( e ){
        if( e.keyCode === 13 ){
            e.preventDefault();
            this.send( 'submitSearch' );
        }
    },

    actions: {
        submitSearch: function(){
            this.get( 'controller' ).transitionToRoute( 'search', this.get( 'searchValue' ) );
        }
    }
} );
