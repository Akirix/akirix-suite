import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( seconds ){
    var result = '0:';
    if( seconds < 10 ){
        result += '0';
    }
    return result + seconds;
} );

