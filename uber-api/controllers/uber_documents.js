var fs = require( 'fs' );
var xss = require( 'xss' );
var Sequelize = require( 'sequelize' );
var _ = require( 'lodash' );
var stream = require( 'stream' );
_.mixin( require( 'lodash-deep' ) );
var AWS = require( 'aws-sdk' );
var config = require( '../config/config.json' );

var platformDb = require( '../models' );
var uberDb = require( '../models_uber' );
var UberDocument = uberDb.UberDocument;

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

AWS.config.update( {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey
} );
var S3 = new AWS.S3( { params: { Bucket: config.aws.uberDocumentBucket } } );

exports.handleError = function( err, req, res ){
    util.handleError( 'document', err, req, res );
};

exports.index = function( req, res, next ){
    var query = {
        where: {
            status: [ 0, 1 ]
        }
    };

    req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
    req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );

    var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
    if( paged ){
        query.offset = ( req.params.page - 1 ) * req.params.per_page;
        query.limit = req.params.per_page;
    }

    var validFields = [ 'model', 'model_id', 'user_id', 'company_id', 'category' ];
    _.forEach( validFields, function( field ){
        if( _.has( req.params, field ) ){
            query.where[ field ] = req.params[ field ];
        }
    } );

    UberDocument.findAndCountAll( query )
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

                res.send( 200, { uberDocuments: documents.rows, meta: { total_pages: totalPages } } );
                return next();
            }
        } );
};


exports.view = function( req, res, next ){

    req.assert( 'uber_document_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        UberDocument.find( {
            where: {
                id: req.params.uber_document_id
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
                    res.send( 200, { uberDocument: document } );
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
    req.assert( 'model', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        var validations = [
            { path: 'files.newDocument.name', validation: _.isString },
            { path: 'files.newDocument.type', validation: _.isString },
            { path: 'files.newDocument.path', validation: _.isString }
        ];

        if( req.params.category ){
            validations.push( { path: 'params.category', validation: _.isString } );
        }

        var errors = [];
        _.forEach( validations, function( check ){
            if( !check.validation( _.deepGet( req, check.path ) ) ){
                var error = {};
                error[ check.path ] = [ 'Unable to find' ];
                errors.push( error );
            }
        } );

        if( errors.length === 0 ){
            var newDoc = UberDocument.build( {
                name: xss( req.files.newDocument.name ),
                type: req.files.newDocument.type,
                model: req.params.model,
                model_id: req.params.model_id,
                company_id: req.params.company_id,
                uber_user_id: req.user.id,
                category: req.params.category,
                protected: req.params.protected,
                status: 1
            } );

            fs.readFile( req.files.newDocument.path, function( err, data ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{
                    var newPath = __dirname + '/../documents/' + req.params.model;

                    if( !fs.existsSync( newPath ) ){
                        fs.mkdirSync( newPath );
                    }

                    fs.writeFile( newPath + '/' + newDoc.id, data, function( err ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else{

                            newDoc.save().then( function(){
                                logger.info( 'uber-document', newDoc.name + '[' + newDoc.id + '] for ' + req.body.model + '[' + req.body.model_id + ']', {
                                    req: req
                                } );

                                res.send( 201, { uberDocument: newDoc } );
                                return next();

                            } ).catch( function( err ){
                                _this.handleError( err, req, res );
                                return next();
                            } );
                        }
                    } );
                }
            } );
        }
        else{
            res.send( 400, { errors: errors } );
            return next();
        }
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};


exports.update = function( req, res, next ){
    req.assert( 'uber_document_id', 'isString' );
    req.assert( 'uberDocument', 'isObject' );
    req.assert( 'uberDocument', 'notEmpty' );

    if( _.isEmpty( req.validationErrors ) ){
        UberDocument.find( {
            where: {
                id: req.params.uber_document_id,
                protected: 0,
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
                        { key: 'company_id', validation: 'isString', validationOptions: {} },
                        { key: 'status', validation: 'isIn', validationOptions: UberDocument.rawAttributes.status.validate.isIn[ 0 ] },
                    ];

                    _.forEach( validParams, function( value ){
                        if( req.params.uberDocument.hasOwnProperty( value.key ) ){

                            // If the property is allowed null and is being set to null don't run the validation
                            if( UberDocument.rawAttributes[ value.key ].allowNull && req.params.uberDocument[ value.key ] === null ){
                                document.values[ value.key ] = null;
                            }
                            else if( req.assert( 'uberDocument.' + value.key, value.validation, value.validationOptions ) === true ){
                                document.values[ value.key ] = req.params.uberDocument[ value.key ];
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
                                    res.send( 200, { uberDocument: document } );

                                    logger.info( 'uber-document', document.name + '[' + document.id + '] for ' + document.model + '[' + document.model_id + ']', {
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

    req.assert( 'uber_document_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        UberDocument.find( {
            where: {
                id: req.params.uber_document_id,
                status: 1,
                protected: 0
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
                                res.send( 200, { uberDocument: document } );

                                logger.info( 'uber-document', document.name + '[' + document.id + '] for ' + document.model + '[' + document.model_id + ']', {
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

    req.assert( 'uber_document_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        UberDocument.find( {
            where: {
                id: req.params.uber_document_id
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
                        var path = __dirname + "/../documents/" + document.model + '/' + document.id;
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

    req.assert( 'uber_document_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        UberDocument.find( {
            where: {
                id: req.params.uber_document_id
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
                        var path = __dirname + "/../documents/" + document.model + '/' + document.id;
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