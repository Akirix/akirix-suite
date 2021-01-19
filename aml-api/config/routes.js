module.exports = function( server, passport ){
    /* Auth + ACL */
    var authACL = [
        passport.authenticate( 'bearer', { session: false } )
    ];

    var search = require( '../controllers/search' );
    server.post( '/', authACL, search.search );
};
