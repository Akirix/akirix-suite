import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( value ){
    if ( typeof value === 'string' ) {
        return value.toLowerCase();
    }
    else {
        return value;
    }
} );

