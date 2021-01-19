var request = require( 'request' );

exports.handleRequest = function( req, res, next ){
    request( {
            method: req.params.method,
            url: req.params.url,
            auth: req.params.auth,
            agentOptions: req.params.agentOptions
        },
        function( error, response, body ){
            res.send( response.statusCode, body )
        } );

};
