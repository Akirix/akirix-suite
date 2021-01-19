exports.status = function( req, res, next ){
    res.send( 200, { status: 'ok', version: process.env.npm_package_version } );
    return next();
};
