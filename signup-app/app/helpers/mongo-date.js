import Ember from 'ember';
export default Ember.Handlebars.makeBoundHelper( function( value, options ){
    var date = moment( value );

    var format = 'YYYY/MM/DD HH:mm:SS';
    if( typeof options.hash.format === 'string' ){
        format = options.hash.format;
    }

    return new Ember.Handlebars.SafeString( date.format( format ) );
} );