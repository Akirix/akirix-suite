var apiKeys = require( '../controllers/keys' );
var BearerStrategy = require( 'passport-http-bearer' ).Strategy;

module.exports = function( passport ){
    passport.use( new BearerStrategy( {},
        function( atoken, done, req ){
            apiKeys.validate( atoken, function( err, client ){
                if( err ){
                    return done( err );
                }
                else if( !client ){
                    return done( null, false );
                }
                else{
                    return done( null, client );
                }
            } );
        }
    ) );
};