import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( data ){
    if( typeof data === 'string' ){
        var result = '';
        for( var i = 0; i < data.length; i++ ){
            if( i < data.length - 4 ){
                result += '*';
            }
            else{
                result += data.charAt( i );
            }
        }

        return result;
    }
    else{
        return data;
    }
} );