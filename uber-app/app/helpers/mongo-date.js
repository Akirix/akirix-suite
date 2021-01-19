import Ember from 'ember';
export default Ember.Handlebars.makeBoundHelper( function( value, options ){
    var date = moment( value );
    if( typeof options.hash.html !== 'undefined' && options.hash.html === true ){
        return new Ember.Handlebars.SafeString( '<strong>' + date.format( "MM/DD/YYYY" ) + '</strong><br><span class="text-muted">' + date.format( "HH:mm:SS" ) + '</span>' );
    }

    if( typeof options.hash.dateonly !== 'undefined' && options.hash.dateonly === true ){
        return date.format( "MM/DD/YYYY" );
    }
    else{
        return date.format( "MM/DD/YYYY HH:mm:SS" );
    }
} );