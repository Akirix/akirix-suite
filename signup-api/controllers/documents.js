
var mongoose = require( 'mongoose' );
var fs = require( 'fs' );
var _ = require( 'lodash' );

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );

var Document = mongoose.model( 'Document' );
var User = mongoose.model( 'User' );
var Registration = mongoose.model( 'Registration' );

var _this = this;

exports.handleError = function( err, req, res ){
    return util.handleError( 'document', err, req, res );
};






exports.create = function( req, res, next ){

    req.assert( 'document_type', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        if( !_.isEmpty( req.files ) && req.files.hasOwnProperty( 'file' ) ){
            // Check file params
            var fileValidation = [
                { valid: _.isString( req.files.file.path ), error: 'Missing file path parameter' },
                { valid: _.isString( req.files.file.type ), error: 'Missing file type parameter' },
                { valid: _.isString( req.files.file.name ), error: 'Missing file name parameter' }
            ];

            var errors = [];
            _.forEach( fileValidation, function( value ){
                if( !value.valid ){
                    errors.push( value.error );
                }
            } );

            if( errors.length === 0 ){

                if( _.indexOf( Document.acceptedFileTypes, req.files[ 'file' ].type ) !== -1 ){

                    // Read the file
                    fs.readFile( req.files[ 'file' ].path, function( err, data ){

                        // Error Reading File
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        // Read File Success
                        else{
                            var base64data = new Buffer( data ).toString( 'base64' );
                            var documentData = {
                                user_id: req.authInfo._id,
                                document_type: req.params.document_type,
                                name: req.files[ 'file' ].name,
                                type: req.files[ 'file' ].type,
                                lastModified: req.files.lastModifiedDate,
                                data: base64data
                            };

                            var document = new Document( documentData );
                            document.save( function( err, result ){
                                if( !!err ){
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else{
                                    logger.info( 'document', 'created [' + document._id + ']', {
                                        req: req,
                                        model: 'document',
                                        model_id: document._id
                                    } );

                                    res.send( 201, result );
                                    return next();
                                }
                            } );
                        }
                    } );
                }
                else{

                    logger.info( 'document', 'Unaccepted file type', {
                        req: req
                    } );

                    res.send( 400, {
                        errors: [
                            { message: 'Unaccepted file type' }
                        ]
                    } );
                    return next();
                }
            }
            else{
                logger.info( 'document', 'Missing document params ' + JSON.stringify( errors ), {
                    req: req
                } );

                res.send( 400, { errors: errors } );
                return next();
            }
        }
        else{
            res.send( 400, { errors: [ 'File in not an object' ] } );
            return next();
        }

    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};






exports.view = function( req, res, next ){
    req.assert( 'document_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Document.findOne( {
            $and: [
                { _id: mongoose.Types.ObjectId( req.params.document_id ) },
                { user_id: mongoose.Types.ObjectId( req.authInfo._id ) }
            ]
        }, function( err, document ){
            if( err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( _.isEmpty( document ) ){
                res.send( 404, {} );
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






exports.download = function( req, res, next ){

    req.assert( 'document_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Document.findOne( {
            $and: [
                { _id: mongoose.Types.ObjectId( req.params.document_id ) },
                { user_id: mongoose.Types.ObjectId( req.authInfo._id ) }
            ]
        }, function( err, document ){
            if( err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( _.isEmpty( document ) ){
                res.send( 404, {} );
                return next();
            }
            else{
                res.setHeader( 'Content-Transfer-Encoding', 'base64' );
                res.setHeader( 'Content-Description', 'File Transfer' );
                res.setHeader( 'Content-Disposition', 'attachment; filename="' + document.name + '"' );
                res.setHeader( 'Content-Type', document.type );
                var buffer = new Buffer( document.data, 'base64' );
                res.send( 200, buffer );
                return next();
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
        Document.findOne( {
            $and: [
                { _id: mongoose.Types.ObjectId( req.params.document_id ) },
                { user_id: mongoose.Types.ObjectId( req.authInfo._id ) }
            ]
        }, function( err, document ){
            if( err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( _.isEmpty( document ) ){
                res.send( 404, {} );
                return next();
            }
            else{
                var buffer = new Buffer( document.data, 'base64' );
                res.end( buffer );
                return next();
            }
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};