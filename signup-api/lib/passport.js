/**
 * @module Authentication
 * @class passport
 * @type {exports}
 */
var tokens = require( '../controllers/tokens' );
var BearerStrategy = require( 'passport-http-bearer' ).Strategy;

/**
 * @method
 * @param passport {Object} pass-in variable for the passport library object
 */
module.exports = function( passport ){
    passport.use( new BearerStrategy( {},
        function( atoken, done ){
            tokens.validate( atoken, function( err, user ){
                if( err ){
                    return done( err );
                }
                else if( !user ){
                    return done( null, false );
                }
                else{
                    return done( null, user, user );
                }
            } );
        }
    ) );
};