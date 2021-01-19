import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( key ){
    var upperCaseKey = key.replace( /\b[a-z]/g, function( g ){
         return g.toUpperCase();
    } );
    var newKey = upperCaseKey.replace( /_/g, ' ' );

    return new Ember.Handlebars.SafeString( newKey );
} );