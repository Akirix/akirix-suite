

var Promise = require( 'promise' );
var _ = require( 'lodash' );
var _this = this;




module.exports.setClient = function( redis ){
    _this.client = redis;
};



function UberUserCache( userId, data ){
    this.data = data || {};
    this.data[ 'id' ] = userId;
}




UberUserCache.prototype.save = function(){
    return new Promise( function( resolve, reject ){
        _this.client.set( 'uber-user-cache-' + this.data.id, JSON.stringify( this.data ), function( err ){
            if( !!err ){
                reject( err );
            }
            else{
                resolve( this.data );
            }
        }.bind( this ) );
    }.bind( this ) );
};




module.exports.find = function( id ){
    return new Promise( function( resolve, reject ){
        _this.client.get( 'uber-user-cache-' + id, function( err, res ){
            if( !!err ){
                reject( err );
            }
            else if( !res ){
                res = '{}';
            }

            try{
                var parsedData = JSON.parse( res );
            }
            catch( err ){
                reject( err );
            }
            resolve( new UberUserCache( id, parsedData ) );
        } );
    } );
};

module.exports.UberUserCache = UberUserCache;