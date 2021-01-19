import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( feeObj ){
    function walk( string, obj ){
        for( var key in obj ){
            if( typeof obj[ key ] === 'object' ){
                string += '<li><strong>' + key + ':</strong> ' + '<ul>' + walk( Ember.A(), obj[ key ] ) + '</ul></li>' ;
            }
            else{
                string += '<li><strong>' + key + ':</strong> ' + obj[ key ] + '</li>';
            }
        }
        return string;
    }

    if( feeObj.object ){
        return walk( '<ul></ul>', feeObj.value );
    }
    else{
        return '<strong>' + feeObj.key + ': </strong>' + feeObj.value;
    }
} );