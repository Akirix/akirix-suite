

var fs = require( 'fs' );
var Sequelize = require( 'sequelize' );
var xss = require( 'xss' );
var db = require( '../models' );
var _ = require( 'lodash' );
var stream = require( 'stream' );
var Promise = require( 'bluebird' );
var Document = db.Document;
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




exports.checkPermissions = function( model, model_id, company_id, callback ){
    if( model_id === null ){
        callback( true );
    }
    else{
        switch( model ){
            case 'project':

                db.Project.find( {
                    where: {
                        id: model_id
                    },
                    include: [
                        {
                            model: db.Node
                        }
                    ]
                } )
                    .done( function( err, project ){
                        if( !!err ){
                            callback( false );
                        }
                        else if( _.isEmpty( project ) ){
                            callback( false );
                        }
                        else{
                            var valid = false;

                            // Allow if the requesting company is a member of the project
                            _.forEach( project.nodes, function( value ){
                                if( value.company_id === company_id ){
                                    valid = true;
                                    return false;
                                }
                            } );

                            if( valid ){
                                callback( true );
                            }
                            else{
                                callback( false );
                            }
                        }
                    } );
                break;

            case 'node':
                db.Node.find( {
                    where: {
                        id: model_id
                    },
                    include: [
                        {
                            model: db.Node,
                            as: 'bnode'
                        }
                    ]
                } ).done( function( err, node ){
                    if( !!err ){
                        callback( false );
                    }
                    else if( _.isEmpty( node ) ){
                        callback( false );
                    }
                    else{
                        if( node.company_id === company_id ){
                            callback( true );
                        }
                        else if( !_.isEmpty( node.bnode ) && node.bnode.company_id === company_id ){
                            callback( true );
                        }
                        else{
                            callback( false );
                        }
                    }
                } );

                break;

            case 'invoice':
                // Find the invoice
                db.Invoice.find( {
                    where: {
                        id: model_id
                    },
                    include: [
                        {
                            model: db.Node,
                            include: [
                                {
                                    model: db.Fund
                                }
                            ]
                        }
                    ]
                } )
                    .done( function( err, invoice ){
                        if( !!err ){
                            callback( false );
                        }
                        else{
                            // Project invoice
                            if( invoice.company_id === company_id ){
                                callback( true );
                            }
                            // One time invoice
                            else if( _.isEmpty( invoice.node ) ){
                                if( invoice.to_company_id === company_id ){
                                    callback( true );
                                }
                                else{
                                    callback( false );
                                }
                            }
                            else{
                                // Allow if the requester is the owner of the invoice
                                if( !_.isEmpty( invoice.node.fund ) && invoice.node.fund.investor_id === company_id ){
                                    callback( true );
                                }
                                else{
                                    db.Node.find( {
                                        where: {
                                            id: invoice.node.parent_id
                                        },
                                        include: [
                                            { model: db.Fund }
                                        ]
                                    } ).done( function( err, parentNode ){
                                        if( !!err ){
                                            callback( false );
                                        }
                                        if( _.isEmpty( parentNode ) ){
                                            callback( false );
                                        }
                                        else{

                                            // Allow if the requester is the receiver of the invoice
                                            if( parentNode.company_id === company_id || ( !_.isEmpty( parentNode.fund ) && parentNode.fund.investor_id === company_id ) ){
                                                callback( true );
                                            }
                                            else{
                                                callback( false );
                                            }
                                        }
                                    } );
                                }
                            }
                        }
                    } );

                break;

            case 'wire':
                // Find the wire and check if the user has access to it
                db.Wire.find( model_id )
                    .done( function( err, wire ){
                        if( !!err ){
                            callback( false );
                        }
                        else if( _.isEmpty( wire ) ){
                            callback( false );
                        }
                        else{
                            callback( true );
                        }
                    } );
                break;

            case 'transaction':
                db.Transaction.find( {
                    where: {
                        id: model_id
                    }
                } )
                    .done( function( err, transaction ){
                        if( !!err ){
                            callback( false );
                        }
                        else if( _.isEmpty( transaction ) ){
                            callback( false );
                        }
                        else{
                            db.Account.findAll( {
                                where: db.Sequelize.or(
                                    { id: transaction.to_account_id },
                                    { id: transaction.from_account_id }
                                )
                            } ).done( function( err, accounts ){
                                if( !!err ){
                                    callback( false );
                                }
                                else if( _.isEmpty( accounts ) ){
                                    callback( false );
                                }
                                else{
                                    var valid = false;

                                    // Allow if the requesting company is a member of the project
                                    _.forEach( accounts, function( value ){
                                        if( value.company_id === company_id ){
                                            valid = true;
                                            return false;
                                        }
                                    } );

                                    if( valid ){
                                        callback( true );
                                    }
                                    else{
                                        callback( false );
                                    }
                                }
                            } );

                        }
                    } );
                break;
            default:
                callback( true );
        }
    }
};





exports.index = function( req, res, next ){

    req.assert( 'model_id', 'isString' );
    req.assert( 'model', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        _this.checkPermissions( req.params.model, req.params.model_id, req.user.company_id, function( result ){
            if( result ){
                Document.findAll( {
                    where: [
                        { model: req.params.model },
                        { model_id: req.params.model_id },
                        [ 'status <> ?', 2 ]
                    ],
                    order: [
                        [ 'name', 'ASC' ]
                    ]
                } )
                    .done( function( err, documents ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else{
                            res.send( 200, { documents: documents } );
                            return next();
                        }
                    } );
            }
            else{
                res.send( 404 );
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
                    _this.checkPermissions( document.model, document.model_id, req.user.company_id, function( result ){
                        if( result ){
                            res.send( 200, { document: document } );
                            return next();
                        }
                        else{
                            res.send( 404 );
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






exports.create = function( req, res, next ){
    req.assert( 'model', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        if( !_.isEmpty( req.files ) && !_.isEmpty( req.files.newDocument ) ){
            var newDoc = Document.build( {
                name: xss( req.files.newDocument.name ),
                type: req.files.newDocument.type,
                model: req.body.model,
                model_id: req.body.model_id,
                status: Number( req.body.status ),
                company_id: req.user.company_id,
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
                                var newPath = __dirname + "/../documents/" + newDoc.id;

                                fs.writeFile( newPath, data, function( err ){
                                    if( !!err ){
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else{
                                        res.send( 201, { document: newDoc } );

                                        logger.info( 'document', newDoc.name + '[' + newDoc.id + '] for ' + req.body.model + '[' + req.body.model_id + ']', {
                                            req: req,
                                            model: 'document',
                                            model_id: newDoc.id
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
                id: req.params.document_id,
                company_id: req.user.company_id
            }
        } )
            .done( function( err, document ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !document ){
                    res.send( 404 );
                    logger.error( 'document', 'No document found using document id [' + req.params.document_id + ']', {
                        req: req
                    } );
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
                                        req: req,
                                        model: 'document',
                                        model_id: document.id,
                                        previousValues: document.selectedValues
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
                company_id: req.user.company_id,
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
                    logger.error( 'document', 'No document found using document id [' + req.params.document_id + ']', {
                        req: req
                    } );
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

                                logger.info( 'document', document.name + '[' + document.id + '] for ' + document.model + '[' + document.model_id + '] has been changed status to 2(Deleted)', {
                                    req: req,
                                    model: 'document',
                                    model_id: document.id
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
                    logger.error( 'document', 'No document found using document id [' + req.params.document_id + ']', {
                        req: req
                    } );
                    return next();
                }
                else{
                    _this.checkPermissions( document.model, document.model_id, req.user.company_id, function( result ){
                        if( result ){
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
                                var path = __dirname + "/../documents/" + document.id;
                                res.setHeader( 'Content-disposition', 'attachment; filename="' + encodeURI( document.name ) + '"' );
                                res.setHeader( 'Content-type', document.type );
                                var filestream = fs.createReadStream( path );
                                filestream.pipe( res );
                                filestream.on( 'end', function(){
                                    return next();
                                } );
                            }
                        }
                        else{
                            res.send( 404 );
                            logger.error( 'document', 'User does not have permissions for document [' + req.params.document_id + ']', {
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
                    _this.checkPermissions( document.model, document.model_id, req.user.company_id, function( result ){
                        if( result ){
                            var path = __dirname + "/../documents/" + document.id;
                            res.setHeader( 'Content-type', document.type );
                            var filestream = fs.createReadStream( path );
                            filestream.pipe( res );

                            filestream.on( 'end', function(){
                                return next();
                            } );
                        }
                        else{
                            res.send( 404 );
                            logger.error( 'document', 'User does not have permissions for document [' + req.params.document_id + ']', {
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