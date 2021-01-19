var db = require( '../models' );
var Key = db.Key;



exports.validate = function( apiKey, fn ){
    Key.find( {
        where: {
            value: apiKey
        }
    } ).then( function( key ){
        if( !key ){
            return fn( null, null );
        }
        else{
            return fn( null, key );
        }
    } )
};
