import Ember from 'ember';
var locale = new Globalize( navigator.language );
export default Ember.Handlebars.makeBoundHelper( function( value ){
    var ouputString = locale.format( value, 'n2' );
    return new Ember.Handlebars.SafeString( ouputString );
} );