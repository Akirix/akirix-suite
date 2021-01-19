
exports.status = function( req, res, next ){
    res.send( 200, { status: 'ok' } );
    return next();
};