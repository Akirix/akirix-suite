import Ember from 'ember';
export default Ember.Handlebars.makeBoundHelper( function( value, options ){
    var date = moment( value );

    var dateFormat = 'MM/DD/YYYY HH:mm:SS';
    if( options.hash.dateFormat === 'string' ){
        dateFormat = options.hash.dateFormat;
    }

    return new Ember.Handlebars.SafeString( date.format( options.hash.dateFormat ) );
} );