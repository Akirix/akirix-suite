var _ = require( 'lodash' );
var _this = this;

/**
 * General buildName function
 * This function will build name field in data
 */

exports.searchKeys = function( entry, keywords, exceptions ){
    var results = '';
    var keyW = new RegExp( keywords, "gi" );
    if( arguments.length > 2 ){
        var exclude = new RegExp( exceptions, "gi" );
        for( var keys in entry ){
            if( keys.match( keyW ) && !keys.match( exclude ) ){
                if( entry[ keys ] && results.indexOf( entry[ keys ] ) === -1 ){
                    results += ' ' + entry[ keys ];
                }
            }
        }
    }
    else{
        for( var keys in entry ){
            if( keys.match( keyW ) ){
                if( entry[ keys ] && results.indexOf( entry[ keys ] ) === -1 ){
                    results += ' ' + entry[ keys ];
                }
            }
        }
    }
    return results.trim();
};