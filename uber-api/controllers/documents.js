

var fs = require( 'fs' );
var xss = require( 'xss' );
var Sequelize = require( 'sequelize' );
var db = require( '../models' );
var _ = require( 'lodash' );
var Promise = require( 'bluebird' );
var Document = db.Document;
var stream = require( 'stream' );
var config = require( '../config/config.json' );
var AWS = require( 'aws-sdk' );

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

AWS.config.update( {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey
} );
var S3 = new AWS.S3( { params: { Bucket: config.aws.appDocumentBucket } } );



exports.handleError = function( err, req, res ){
    util.handleError( 'document', err, req, res );
};





exports.index = function( req, res, next ){

    var query = {
        where: {}
    };

    req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
    req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );

    var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
    if( paged ){
        query.offset = ( req.params.page - 1 ) * req.params.per_page;
        query.limit = req.params.per_page;
    }

    var validFields = [ 'model', 'model_id', 'user_id', 'company_id' ];
    _.forEach( validFields, function( field ){
        if( _.has( req.params, field ) ){
            query.where[ field ] = req.params[ field ];
        }
    } );

    if( _.isEmpty( req.validationErrors ) ){
        Document.findAndCountAll( query )
            .done( function( err, documents ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{
                    var totalPages = 1;
                    if( paged ){
                        var pageRatio = documents.count / req.params.per_page;
                        totalPages = Math.floor( pageRatio );
                        if( pageRatio % 1 > 0 ){
                            totalPages++;
                        }
                    }
                    res.send( 200, { documents: documents.rows, meta: { total_pages: totalPages } } );
                    return next();
                }
            } );

    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};







exports.view = function( req, res, next ){

    req.assert( 'document_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Document.find( {
            where: {
                id: req.params.document_id
            }
        } )
            .done( function( err, document ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !document ){
                    res.send( 404 );
                    return next();
                }
                else{
                    res.send( 200, { document: document } );
                    return next();
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};






exports.create = function( req, res, next ){
    if( _.isEmpty( req.validationErrors ) ){
        if( !_.isEmpty( req.files ) && !_.isEmpty( req.files.newDocument ) ){
            var newDoc = Document.build( {
                name: xss( req.files.newDocument.name ),
                type: req.files.newDocument.type,
                model: req.body.model,
                model_id: req.body.model_id,
                status: Number( req.body.status ),
                company_id: req.body.company_id,
                user_id: req.user.id
            } );

            newDoc.save()
                .done( function( err ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                    }
                    else{
                        fs.readFile( req.files.newDocument.path, function( err, data ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else{
                                var newPath = __dirname + "/../documents-platform/" + newDoc.id;

                                fs.writeFile( newPath, data, function( err ){
                                    if( !!err ){
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else{
                                        res.send( 201, { document: newDoc } );

                                        logger.info( 'document', newDoc.name + '[' + newDoc.id + '] for ' + req.body.model + '[' + req.body.model_id + ']', {
                                            req: req
                                        } );

                                        return next();
                                    }
                                } );
                            }
                        } );
                    }
                } );
        }
        else{
            res.send( 400, { errors: [ 'Missing file information' ] } );
            return next();
        }
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};




exports.update = function( req, res, next ){
    req.assert( 'document_id', 'isString' );
    req.assert( 'document', 'isObject' );
    req.assert( 'document', 'notEmpty' );

    if( _.isEmpty( req.validationErrors ) ){
        Document.find( {
            where: {
                id: req.params.document_id
            }
        } )
            .done( function( err, document ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !document ){
                    res.send( 404 );
                    return next();
                }
                else{

                    var validParams = [
                        { key: 'model', validation: 'isString', validationOptions: {} },
                        { key: 'model_id', validation: 'isString', validationOptions: {} },
                        { key: 'status', validation: 'isIn', validationOptions: Document.rawAttributes.status.validate.isIn[ 0 ] },
                    ];

                    _.forEach( validParams, function( value ){
                        if( req.params.document.hasOwnProperty( value.key ) ){

                            // If the property is allowed null and is being set to null don't run the validation
                            if( Document.rawAttributes[ value.key ].allowNull && req.params.document[ value.key ] === null ){
                                document[ value.key ] = null;
                            }
                            else if( req.assert( 'document.' + value.key, value.validation, value.validationOptions ) === true ){
                                document[ value.key ] = req.params.document[ value.key ];
                            }
                        }
                    } );

                    if( _.isEmpty( req.validationErrors ) ){
                        document.save()
                            .done( function( err, result ){
                                if( !!err ){
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else{
                                    res.send( 200, { document: document } );

                                    logger.info( 'document', document.name + '[' + document.id + '] for ' + document.model + '[' + document.model_id + ']', {
                                        req: req
                                    } );
                                    return next();
                                }
                            } );
                    }
                    else{
                        util.handleValidationErrors( req, res );
                        return next();
                    }
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};






exports.delete = function( req, res, next ){

    req.assert( 'document_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Document.find( {
            where: {
                id: req.params.document_id,
                status: 1
            }
        } )
            .done( function( err, document ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !document ){
                    res.send( 404 );
                    return next();
                }
                else{
                    document.status = 2;
                    document.save()
                        .done( function( err ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else{
                                res.send( 200, { document: document } );

                                logger.info( 'document', document.name + '[' + document.id + '] for ' + document.model + '[' + document.model_id + ']', {
                                    req: req
                                } );

                                return next();
                            }
                        } );
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};







exports.download = function( req, res, next ){

    req.assert( 'document_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Document.find( {
            where: {
                id: req.params.document_id
            }
        } )
            .done( function( err, document ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !document ){
                    res.send( 404 );
                    return next();
                }
                else{
                    if( document.s3_uri ){
                        S3.getObject( { Key: document.id } ).promise().then( function( data ){
                            res.setHeader( 'Content-disposition', 'attachment; filename="' + encodeURI( document.name ) + '"' );
                            res.setHeader( 'Content-type', document.type );
                            var bufferStream = new stream.PassThrough();
                            bufferStream.end( data.Body );
                            bufferStream.pipe( res );
                            bufferStream.on( 'end', function(){
                                return next();
                            } );
                        } ).catch( function( err ){
                            _this.handleError( err, req, res );
                            return next();
                        } )
                    }
                    else{
                        var path = __dirname + "/../documents-platform/" + document.id;
                        res.setHeader( 'Content-disposition', 'attachment; filename="' + encodeURI( document.name ) + '"' );
                        res.setHeader( 'Content-type', document.type );
                        var filestream = fs.createReadStream( path );
                        filestream.pipe( res );

                        filestream.on( 'end', function(){
                            return next();
                        } );
                    }
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};







exports.stream = function( req, res, next ){

    req.assert( 'document_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Document.find( {
            where: {
                id: req.params.document_id
            }
        } )
            .done( function( err, document ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !document ){
                    res.send( 404 );
                    return next();
                }
                else{
                    if( document.s3_uri ){
                        S3.getObject( { Key: document.id } ).promise().then( function( data ){
                            res.setHeader( 'Content-type', document.type );
                            var bufferStream = new stream.PassThrough();
                            bufferStream.end( data.Body );
                            bufferStream.pipe( res );
                            bufferStream.on( 'end', function(){
                                return next();
                            } );
                        } ).catch( function( err ){
                            _this.handleError( err, req, res );
                            return next();
                        } )
                    }
                    else{
                        var path = __dirname + "/../documents-platform/" + document.id;
                        res.setHeader( 'Content-type', document.type );
                        var filestream = fs.createReadStream( path );
                        filestream.pipe( res );

                        filestream.on( 'end', function(){
                            return next();
                        } );
                    }
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};