var Sequelize = require( 'sequelize' );
var db = require( '../models' );
var moment = require( 'moment-timezone' );
var _ = require( 'lodash' );
var request = require( 'request' );
var math = require( 'mathjs' );

var Wire = db.Wire;
var WireBatch = db.WireBatch;
var Company = db.Company;
var Bank = db.Bank;
var BankRoute = db.BankRoute;

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

var transports = require( '../config/config.json' ).akxLogger.transports;
var currentFileName = __filename.split( '/' ).pop();
var akxLogger = require( 'logger' )( currentFileName, transports );
var akxStrings = require( 'akx-strings' )();

var censoredWords = require( '../config/config.json' ).censoredWords;

exports.handleError = function( err, req, res ){
    util.handleError( 'wire', err, req, res );
};





exports.index = function( req, res, next ){

    var query = {
        where: [],
        order: [
            [ db.sequelize.col( 'wire_batches.updated_at' ), 'DESC' ]
        ]
    };
    req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
    req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );

    var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
    if( paged ){
        query.offset = (req.params.page - 1) * req.params.per_page;
        query.limit = req.params.per_page;
    }

    if( !_.isEmpty( req.params.status ) ){
        query.where.push( { status: req.params.status } );
    }

    if( _.isEmpty( query.where ) ){
        query.where = {};
    }
    WireBatch.findAndCountAll( query ).done( function( err, batches ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else if( !batches ){
            res.send( 404 );
            return next();
        }
        else{
            var totalPages = 1;
            if( paged ){
                var pageRatio = batches.count / req.params.per_page;
                totalPages = Math.floor( pageRatio );
                if( pageRatio % 1 > 0 ){
                    totalPages++;
                }
            }
            for( var i = 0; i < batches.rows.length; i++ ){
                batches.rows[ i ].values.links = {
                    wires: '/wires?wire_batch_id=' + batches.rows[ i ].id
                };
            }
            res.send( 200, { wireBatches: batches.rows, meta: { total_pages: totalPages } } );
            return next();
        }
    } );
};





exports.view = function( req, res, next ){

    req.assert( 'wire_batch_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        WireBatch.find( {
            where: [
                { id: req.params.wire_batch_id }
            ]
        } ).done( function( err, batch ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !batch ){
                res.send( 404 );
                return next();
            }
            else{
                batch.values.links = {
                    wires: '/wires?wire_batch_id=' + batch.id
                };
                res.send( 200, { wireBatch: batch } );
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
    req.assert( 'wireBatch', 'isObject' );
    req.assert( 'wireBatch.type', 'isIn', WireBatch.rawAttributes.type.validate.isIn[ 0 ] );
    if( _.isEmpty( req.validationErrors ) ){

        WireBatch.create( {
            type: req.params.wireBatch.type,
            bank_route_id: req.params.wireBatch.bank_route_id,
            currency_id: req.params.wireBatch.currency_id,
            status: 0,
            scheduled_time: moment.utc().format()
        } ).then( function( newBatch ){
            res.send( 201, { wireBatch: newBatch } );
            logger.info( 'wire-batch', 'New batch created', {
                req: req,
                model: 'wire-batch',
                model_id: newBatch.id
            } );
            return next();
        } ).catch( function( err ){
            _this.handleError( err, req, res );
            return next();
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};





exports.update = function( req, res, next ){
    req.assert( 'wireBatch', 'isObject' );
    req.assert( 'wire_batch_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        WireBatch.find( {
            where: [
                { id: req.params.wire_batch_id }
            ]
        } ).then( function( batch ){
            if( !batch ){
                return res.send( 404 );
            }
            else{
                var validParams = [
                    { key: 'scheduled_time', validation: 'isString', validationOptions: {} },
                    { key: 'bank_route_id', validation: 'isString', validationOptions: {} },
                    { key: 'currency_id', validation: 'isString', validationOptions: {} },
                    { key: 'type', validation: 'isIn', validationOptions: WireBatch.rawAttributes.type.validate.isIn[ 0 ] }
                ];

                _.forEach( validParams, function( value ){
                    if( req.params.wireBatch.hasOwnProperty( value.key ) ){
                        if( WireBatch.rawAttributes[ value.key ].allowNull && req.params.wireBatch[ value.key ] === null ){
                            batch[ value.key ] = null;
                        }
                        else if( req.assert( 'wireBatch.' + value.key, value.validation, value.validationOptions ) === true ){
                            batch[ value.key ] = req.params.wireBatch[ value.key ];
                        }
                    }
                } );

                var promises = [];

                Wire.findAll( {
                    where: {
                        wire_batch_id: batch.id
                    }
                } ).then( function( wires ){
                    _.forEach( wires, function( wire ){
                        promises.push( wire.updateAttributes( {
                            bank_route_id: batch.bank_route_id
                        } ) );
                    } );

                    promises.push( batch.save() );
                    Promise.all( promises ).then( function(){
                        res.send( 200, { wireBatch: batch } );
                        return next();
                    } );
                } );
            }
        } ).catch( function( err ){
            return util.handleLibError( err, req, res, akxLogger );
        } )
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.setSent = function( req, res, next ){
    WireBatch.find( {
        where: [
            { id: req.params.wire_batch_id },
            { status: 0 }
        ],
        include: [
            { model: Wire, include: [ Company ] },
            { model: BankRoute }
        ]
    } ).then( function( batch ){
        if( !batch ){
            return res.send( 404 );
        }
        else if( batch.wires.length === 0 ){
            return res.send( 400, { errors: [ 'Cannot send empty batch' ] } );
        }
        else if( !batch.bankRoute ){
            return res.send( 400, { errors: [ 'Invalid bank_route_id' ] } );
        }
        else{
            batch.values.amount = 0;
            batch.values.status = 1;
            _.forEach( batch.wires, function( wire ){
                if( wire.status !== 1 ){
                    akxLogger.error( 'wire-batch ' + batch.id + ' contains wire ' + wire.id + ' with invalid status', null, null, { 'wire-batch': batch, wire: wire } );
                    throw new Error( 'Wire batch contains invalid wire' );
                }

                var regex;
                for( var i = 0; i < censoredWords.length; i++ ){
                    regex = new RegExp( censoredWords[ i ], "g" );
                    if( !_.isEmpty( wire.notes ) ){
                        wire.notes = wire.notes.replace( regex, '' );
                    }
                }

                batch.values.amount += wire.amount;
            } );
            batch.values.amount = math.round( batch.values.amount, 2 );
            if( batch.bankRoute.raw_data_func && WireBatch.hasOwnProperty( batch.bankRoute.raw_data_func ) ){
                batch.values.raw_data = WireBatch[ batch.bankRoute.raw_data_func ]( batch, Bank );
            }
            batch.save().then( function(){
                akxLogger.info( 'sent WireBatch ' + batch.id + ' amount ' + batch.amount, null, [ { model: 'wire-batch', model_id: batch.id } ] );
                res.send( 200, { wireBatch: batch } );
                return next();
            } );
        }
    } ).catch( function( err ){
        return util.handleLibError( err, req, res, akxLogger );
    } )
};

exports.delete = function( req, res, next ){

    req.assert( 'wire_batch_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Wire.findAll( {
            where: {
                wire_batch_id: req.params.wire_batch_id
            }
        } ).then( function( wires ){
            if( wires.length >= 1 ){
                res.send( 400, { errors: [ 'There are wires existing in the batch' ] } );
                return next();
            }
            else{
                WireBatch.find( {
                    where: {
                        id: req.params.wire_batch_id,
                        status: 0
                    }
                } ).then( function( batch ){
                    if( !batch ){
                        res.send( 400, { errors: [ 'No batch was found' ] } );
                        return next();
                    }
                    else{
                        batch.destroy().then( function(){
                            res.send( 200, { wireBatch: batch } );
                            logger.info( 'wire-batch', 'New Batch has been removed', {
                                req: req,
                                model: 'wire-batch',
                                model_id: batch.id
                            } );
                            return next();
                        } ).catch( function( err ){
                            _this.handleError( err, req, res );
                            return next();
                        } );
                    }
                } ).catch( function( err ){
                    _this.handleError( err, req, res );
                    return next();
                } )

            }
        } ).catch( function( err ){
            _this.handleError( err, req, res );
            return next();
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.download = function( req, res, next ){
    WireBatch.find( {
        where: [
            { id: req.params.wire_batch_id }
        ],
        include: [
            { model: BankRoute }
        ]
    } ).then( function( batch ){
        if( !batch ){
            return res.send( 404 );
        }
        else{
            res.setHeader( 'Content-Description', 'File Transfer' );
            res.setHeader( 'Content-Disposition', 'attachment; filename="' + batch.bankRoute.name + ' ' + moment.utc().format( 'YYYY-MM-DD-HH-mm-ss' ) + '.' + batch.bankRoute.file_format + '"' );
            res.setHeader( 'Content-Type', 'text/plain' );
            res.send( 200, batch.raw_data );
            return next();
        }
    } ).catch( function( err ){
        return util.handleLibError( err, req, res, akxLogger );
    } )
};

exports.setReceived = function( req, res, next ){
    req.assert( 'data', 'isObject' );
    req.assert( 'data.response', 'isString' );
    if( _.isEmpty( req.validationErrors ) ){
        WireBatch.find( {
            where: [
                { id: req.params.wire_batch_id },
                { status: 1 }
            ]
        } ).then( function( batch ){
            if( !batch ){
                return res.send( 404 );
            }
            else if( batch.status !== 1 ){
                return res.send( 400, { errors: [ 'Invalid wire-batch status' ] } );
            }
            else{
                batch.values.response = req.body.data.response;
                batch.values.status = 2;
                batch.save().then( function(){
                    akxLogger.info( 'set WireBatch status to 2 (received)', null, [ { model: 'wire-batch', model_id: batch.id } ] );
                    res.send( 200, { wireBatch: batch } );
                    return next();
                } );
            }
        } ).catch( function( err ){
            return util.handleLibError( err, req, res, akxLogger );
        } )
    }
    else{
        util.handleValidationErrors( req, res, akxLogger );
    }
};
