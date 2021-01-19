var tokens = require( '../controllers/tokens' );
var BearerStrategy = require( 'passport-http-bearer' ).Strategy;

module.exports = function( passport ){
    passport.use( new BearerStrategy( {},
        function( atoken, done, req ){
            tokens.validate( atoken, function( err, user ){
                if( err ){
                    return done( err );
                }
                else if( !user ){
                    return done( null, false );
                }
                else{
                    return done( null, user );
                }
            } );
        }
    ) );
};