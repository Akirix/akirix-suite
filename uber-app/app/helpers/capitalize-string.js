import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( string ){
	return new Handlebars.SafeString( string.charAt( 0 ).toUpperCase() + string.slice( 1 ) );
} );