



var Sequelize = require( 'sequelize' );
var _ = require( 'lodash' );
var db = require( '../models' );
var Node = db.Node;
var Project = db.Project;
var Invoice = db.Invoice;
var InvoiceItem = db.InvoiceItem;

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;



exports.handleError = function( err, req, res ){
    util.handleError( 'invoice', err, req, res );
};





exports.index = function( req, res, next ){
    var query = {
        where: {},
        order: [
            [ 'name', 'ASC' ]
        ]
    };

    var validFields = [ 'invoice_id' ];
    _.forEach( validFields, function( field ){
        if( _.has( req.params, field ) ){
            query.where[ field ] = req.params[ field ];
        }
    } );

    if( _.isEmpty( req.validationErrors ) ){

        InvoiceItem.findAll( query )
            .done( function( err, invoiceItems ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !invoiceItems ){
                    res.send( 200, { invoiceItems: [] } );
                    return next();
                }
                else{
                    res.send( 200, { invoiceItems: invoiceItems } );
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

    req.assert( 'invoiceItem', 'isObject' );
    req.assert( 'invoiceItem.price', 'isNumber' );
    req.assert( 'invoiceItem.quantity', 'isNumber' );

    if( _.isEmpty( req.validationErrors ) ){

        db.Invoice.find( req.params.invoiceItem.invoice_id ).done( function( err, invoice ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( _.isEmpty( invoice ) ){
                res.send( 400, { errors: [ 'Invoice not found' ] } );
                return next();
            }
            else if( invoice.status !== 0 ){
                res.send( 400, { errors: [ 'Invoice must be status 0 (draft)' ] } );
            }
            else{
                var newItem = InvoiceItem.build( {
                    name: req.body.invoiceItem.name,
                    unit: req.body.invoiceItem.unit,
                    price: req.body.invoiceItem.price,
                    quantity: req.body.invoiceItem.quantity,
                    invoice_id: req.body.invoiceItem.invoice_id
                } );

                if( req.body.invoiceItem.quantity && req.body.invoiceItem.quantity >= 0 ){
                    newItem.save().done( function( err ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else{
                            res.send( 201, { invoice_item: newItem } );

                            logger.info( 'invoice', newItem.name + '[' + newItem.id + '] for I-' + invoice.name + '[' + invoice.id + ']', {
                                req: req
                            } );

                            return next();
                        }
                    } );
                }
                else{
                    res.send( 400, { errors: [ 'Invalid invoice item quantity' ] } );
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





exports.update = function( req, res, next ){

    req.assert( 'invoice_item_id', 'isString' );
    req.assert( 'invoiceItem', 'isObject' );
    req.assert( 'invoiceItem', 'notEmpty' );

    if( _.isEmpty( req.validationErrors ) ){
        InvoiceItem.find( req.params.invoice_item_id )
            .done( function( err, item ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !item ){
                    res.send( 404 );
                    return next();
                }
                else{

                    // Find related invoice
                    db.Invoice.find( item.invoice_id ).done( function( err, invoice ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else if( _.isEmpty( invoice ) ){
                            res.send( 400, { errors: [ 'Cannot find associated invoice' ] } );
                            return next();
                        }
                        else if( invoice.status !== 0 ){
                            res.send( 400, { errors: [ 'Invoice must be status 0 (draft)' ] } );
                            return next();
                        }
                        else{

                            var validParams = [
                                { key: 'price', validation: 'isNumber' },
                                { key: 'name', validation: 'isString' },
                                { key: 'unit', validation: 'isString' },
                                { key: 'quantity', validation: 'isNumber' }
                            ];

                            _.forEach( validParams, function( value ){
                                if( req.params.invoiceItem.hasOwnProperty( value.key ) ){

                                    // If the property is allowed null and is being set to null don't run the validation
                                    if( InvoiceItem.rawAttributes[ value.key ].allowNull && req.params.invoiceItem[ value.key ] === null ){
                                        item[ value.key ] = null;
                                    }
                                    else if( req.assert( 'invoiceItem.' + value.key, value.validation ) === true ){
                                        item[ value.key ] = req.params.invoiceItem[ value.key ];
                                    }
                                }
                            } );

                            if( _.isEmpty( req.validationErrors ) ){
                                item.save().done( function( err ){
                                    if( !!err ){
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else{
                                        res.send( 200, { invoiceItem: item } );

                                        logger.info( 'invoice', item.name + '[' + item.id + '] for I-' + invoice.name + ' [' + invoice.id + ']', {
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
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};





exports.delete = function( req, res, next ){

    req.assert( 'invoice_item_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        InvoiceItem.find( req.params.invoice_item_id )
            .done( function( err, item ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !item ){
                    res.send( 404 );
                    return next();
                }
                else{

                    // Find related invoice
                    db.Invoice.find( item.invoice_id ).done( function( err, invoice ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else if( _.isEmpty( invoice ) ){
                            res.send( 400, { errors: [ 'Cannot find associated invoice' ] } );
                            return next();
                        }
                        else if( invoice.status !== 0 ){
                            res.send( 400, { errors: [ 'Invoice must be status 0 (draft)' ] } );
                        }
                        else{
                            item.destroy().done( function( err ){
                                if( !!err ){
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else{
                                    res.send( 200, { invoiceItem: item } );

                                    logger.info( 'invoice', item.name + '[' + item.id + '] for I-' + invoice.name + '[' + invoice.id + ']', {
                                        req: req
                                    } );
                                }
                            } );
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

