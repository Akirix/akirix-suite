var restify = require( 'restify' );

module.exports = function( server ){

    // PDFs Controller
    var pdfs = require( '../controllers/pdfs' );
    server.post( '/pdfs', pdfs.create );
    server.get( '/pdfs/:file_name', pdfs.view );

    // utilities controller
    var utilities = require( '../controllers/utilities' );
    server.get( '/info/status', utilities.status );

    // Static
    server.get( /\/img\/?.*/, restify.serveStatic( {
        directory: 'templates'
    } ) );

    server.get( /\/css\/?.*/, restify.serveStatic( {
        directory: 'templates'
    } ) );
};