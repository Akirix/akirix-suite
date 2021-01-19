var Sequelize = require( 'sequelize' );
var moment = require( 'moment-timezone' );
var _ = require( 'lodash' );
var math = require( 'mathjs' );
var Hashids = require( "hashids" );
var pdfConfig = require( '../config/config.json' ).pdf_api;
var hashidConfig = require( '../config/config.json' ).secrets.hashId;
var request = require( 'request' );
var Promise = require( 'promise' );
var json2csv = require( 'json2csv' );
var brnv = require( 'bank-routing-number-validator' );
var ibantools = require( 'ibantools' );

var db = require( '../models' );
var Bank = db.Bank;
var Wire = db.Wire;
var WireBatch = db.WireBatch;
var Company = db.Company;
var Transaction = db.Transaction;
var Currency = db.Currency;
var Node = db.Node;
var Fee = db.Fee;
var Account = db.Account;
var AccountAlias = db.AccountAlias;
var BankRoute = db.BankRoute;
var Invoice = db.Invoice;
var InvoiceItem = db.InvoiceItem;

var dbInstitution = require( '../models_institution' );
var CompanyRelationship = dbInstitution.CompanyRelationship;

var UberException = require( '../models_uber' ).UberException;

var notifier = require( '../lib/akx.notifier.js' );
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;
var hashids = new Hashids( hashidConfig, 11, "LP4D7XBFO8A2NZYK5EUIR6MVH3WQJGS10TC9" );
var invoiceNameHasher = new Hashids( hashidConfig, 5, "BQO258NH06VMRS1LX4J7WYKC3DIFTZUAG9EP" );

var transports = require( '../config/config.json' ).akxLogger.transports;
var currentFileName = __filename.split( '/' ).pop();
var akxLogger = require( 'logger' )( currentFileName, transports );
var akxStrings = require( 'akx-strings' )();

exports.handleError = function( err, req, res ){
    util.handleError( 'wire', err, req, res );
};





exports.index = function( req, res, next ){

    var query = {
        where: [],
        order: 'updated_at DESC'
    };

    req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
    req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );

    var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
    if( paged ){
        query.offset = ( req.params.page - 1 ) * req.params.per_page;
        query.limit = req.params.per_page;
    }

    // Check if is filtered by company_id
    if( !_.isEmpty( req.params.parent_id ) ){
        query.where.push( { parent_id: req.params.parent_id } );
    }

    if( !_.isEmpty( req.params.company_id ) ){
        if( !_.isEmpty( req.params.company_account_number ) ){
            query.where.push(
                Sequelize.or(
                    { account_number: req.params.company_account_number },
                    { company_id: req.params.company_id }
                )
            );
        }
        else{
            query.where.push( { company_id: req.params.company_id } );
        }
    }

    if( !_.isEmpty( req.params.status ) ){
        query.where.push( { status: req.params.status } );
    }

    if( !_.isEmpty( req.params.type ) ){
        query.where.push( { type: req.params.type } );
    }


    if( !_.isEmpty( req.params.method ) ){
        query.where.push( { method: req.params.method } );
    }

    if( !_.isEmpty( req.params.updated_at ) && req.params.updated_at instanceof Array && req.params.updated_at.length === 2 ){
        var period_from = req.params.updated_at[ 0 ];
        var period_to = req.params.updated_at[ 1 ];
        if( !_.isEmpty( period_from ) && !_.isEmpty( period_to ) ){
            query.where.push( {
                updated_at: {
                    between: [ period_from + ' 00:00:00', period_to + ' 23:59:59' ]
                }
            } );
        }
        else if( !_.isEmpty( period_from ) && _.isEmpty( period_to ) ){
            query.where.push( {
                updated_at: {
                    gte: period_from + ' 00:00:00'
                }
            } );
        }
        else if( !_.isEmpty( period_to ) && _.isEmpty( period_from ) ){
            query.where.push( {
                updated_at: {
                    lte: period_to + '23:59:59'
                }
            } )

        }
    }

    if( !_.isEmpty( req.params.account_holder ) ){
        req.params.account_holder = req.params.account_holder.trim();
        query.where.push( { account_holder: { like: '%' + req.params.account_holder + '%' } } );
    }
    if( !_.isEmpty( req.params.name ) ){
        req.params.name = req.params.name.trim();
        query.where.push( { name: { like: '%' + req.params.name + '%' } } );
    }

    if( !_.isEmpty( req.params.reference ) ){
        req.params.reference = req.params.reference.trim();
        query.where.push( { reference: { like: '%' + req.params.reference + '%' } } );
    }

    if( !_.isEmpty( req.params.amount ) && req.params.amount instanceof Array && req.params.amount.length === 2 ){
        var min_amount = req.params.amount[ 0 ];
        var max_amount = req.params.amount[ 1 ];
        if( !_.isEmpty( min_amount ) && !_.isEmpty( max_amount ) ){
            query.where.push( {
                amount: {
                    between: [ min_amount, max_amount ]
                }
            } );
        }
        else if( !_.isEmpty( min_amount ) && _.isEmpty( max_amount ) ){
            query.where.push( {
                amount: {
                    gte: min_amount
                }
            } );
        }
        else if( _.isEmpty( min_amount ) && !_.isEmpty( max_amount ) ){
            query.where.push( {
                amount: {
                    lte: max_amount
                }
            } )

        }
    }

    if( !_.isEmpty( req.params.bank_name ) ){
        req.params.bank_name = req.params.bank_name.trim();
        query.where.push( { bank_name: { like: '%' + req.params.bank_name + '%' } } );
    }


    if( !_.isEmpty( req.params.wire_batch_id ) ){
        if( req.params.wire_batch_id === 'null' ){
            query.where.push( { wire_batch_id: null } );
        }
        else{
            query.where.push( { wire_batch_id: req.params.wire_batch_id } );
        }
    }

    if( !_.isEmpty( req.params.currency_id ) ){
        query.where.push( { currency_id: req.params.currency_id } );
    }

    if( !_.isEmpty( req.params.bank_country ) ){
        query.where.push( { bank_country: req.params.bank_country } );
    }

    if( !_.isEmpty( req.params.bank_route_id ) ){
        query.where.push( { bank_route_id: { like: '%' + req.params.bank_route_id + '%' } } )
    }

    if( _.isEmpty( query.where ) ){
        query.where = {};
    }

    Wire.findAndCountAll( query )
        .done( function( err, wires ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                var totalPages = 1;
                if( paged ){
                    var pageRatio = wires.count / req.params.per_page;
                    totalPages = Math.floor( pageRatio );
                    if( pageRatio % 1 > 0 ){
                        totalPages++;
                    }
                }
                res.send( 200, { wires: wires.rows, meta: { total_pages: totalPages } } );
                return next();
            }
        } );
};





exports.view = function( req, res, next ){

    req.assert( 'wire_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Wire.find( {
            where: [
                { id: req.params.wire_id }
            ]
        } ).done( function( err, wire ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !wire ){
                res.send( 404 );
                return next();
            }
            else{
                wire.values.links = {
                    company: '/companies/' + wire.company_id
                };
                res.send( 200, { wire: wire } );
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
    req.assert( 'wire', 'isObject' );
    req.assert( 'wire.type', 'isNumber' );

    if( _.isEmpty( req.validationErrors ) ){
        switch( req.body.wire.type ){
            case 0:
                exports.wireOut( req, res, next );
                break;
            case 1:
                exports.wireIn( req, res, next );
                break;
            case 2:
                exports.bookTransfer( req, res, next );
                break;
            default:
                res.send( 400, { errors: [ 'Invalid wire type' ] } );
                return next();
        }
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};


exports.update = function( req, res, next ){
    req.assert( 'wire', 'isObject' );
    req.assert( 'wire_id', 'isString' );


    if( _.isEmpty( req.validationErrors ) ){
        Wire.find( {
            where: [
                { id: req.params.wire_id }
            ]
        } ).done( function( err, wire ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !wire ){
                res.send( 404 );
                logger.error( 'wire', 'Wire not found', {
                    req: req
                } );
                return next();
            }
            else if( wire.status !== 0 && wire.status !== 4 && wire.status !== 6 && wire.status !== 7 ){
                res.send( 400, { errors: [ 'Only new wires can be updated' ] } );
                logger.error( 'wire', 'Only new wires can be updated', {
                    req: req
                } );
                return next();
            }
            else{
                var validParams = [
                    { key: 'status', validation: 'isNumber' },
                    { key: 'method', validation: 'isNumber' },
                    { key: 'notes', validation: 'isString' },
                    { key: 'notes_akirix', validation: 'isString' },
                    { key: 'bank_name', validation: 'isString' },
                    { key: 'bank_address', validation: 'isString' },
                    { key: 'bank_city', validation: 'isString' },
                    { key: 'bank_state_province', validation: 'isString' },
                    { key: 'bank_postal_code', validation: 'isString' },
                    { key: 'bank_country', validation: 'isString' },
                    { key: 'bank_phone', validation: 'isString' },
                    { key: 'code_swift', validation: 'isString' },
                    { key: 'code_aba', validation: 'isString' },
                    { key: 'code_irc', validation: 'isString' },
                    { key: 'account_holder', validation: 'isString' },
                    { key: 'account_number', validation: 'isString' },
                    { key: 'account_iban', validation: 'isString' },
                    { key: 'company_id', validation: 'isString' },
                    { key: 'account_id', validation: 'isString' },
                    { key: 'fee', validation: 'isNumber' },
                    { key: 'intermediary_bank_name', validation: 'isString' },
                    { key: 'intermediary_bank_country', validation: 'isString' },
                    { key: 'intermediary_bank_address', validation: 'isString' },
                    { key: 'intermediary_bank_city', validation: 'isString' },
                    { key: 'intermediary_bank_state_province', validation: 'isString' },
                    { key: 'intermediary_bank_postal_code', validation: 'isString' },
                    { key: 'intermediary_bank_code_swift', validation: 'isString' },
                    { key: 'intermediary_bank_code_aba', validation: 'isString' },
                    { key: 'confirmation', validation: 'isString' },
                    { key: 'preferred_account_number', validation: 'isString' },
                    { key: 'raw_data', validation: 'isString' },
                    { key: 'reference', validation: 'isString' },
                    { key: 'bank_route_id', validation: 'isString' }
                ];
                _.forEach( validParams, function( value ){
                    if( req.params.wire.hasOwnProperty( value.key ) ){
                        if( Wire.rawAttributes[ value.key ].allowNull && req.params.wire[ value.key ] === null ){
                            wire[ value.key ] = null;
                        }
                        else if( req.assert( 'wire.' + value.key, value.validation ) === true ){
                            wire[ value.key ] = req.params.wire[ value.key ];
                        }
                    }
                } );

                wire.save().done( function( err ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else{
                        res.send( 200, { wire: wire } );
                        logger.info( 'wire', 'Wire has been update', {
                            req: req,
                            model: 'wire',
                            model_id: wire.id
                        } );
                    }
                } )
            }
        } )
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};





exports.wireIn = function( req, res, next ){

    req.assert( 'wire', 'isObject' );
    req.assert( 'wire.account_id', 'isString' );
    req.assert( 'wire.amount', 'isNumber' );
    req.assert( 'wire.type', 'isNumber' );


    if( _.isEmpty( req.validationErrors ) ){

        Account.find( {
            where: [
                { id: req.body.wire.account_id },
                { type: 0 }
            ],
            include: [
                { model: Currency }
            ]
        } )
            .done( function( err, account ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !account ){
                    res.send( 400, { errors: [ 'Account not found ' ] } );
                    logger.error( 'wire', 'account not found', {
                        req: req
                    } );
                    return next();
                }
                else if( req.body.wire.amount <= 0 ){
                    res.send( 400, {
                        errors: [
                            { 'wire.amount': [ 'Amount must be greater than 0' ] }
                        ]
                    } );
                    logger.error( 'wire', 'wire amount is <= 0', {
                        req: req
                    } );
                    return next();
                }
                else{
                    if( req.body.wire.hasOwnProperty( 'parent_id' ) && !_.isEmpty( req.body.wire.parent_id ) ){
                        Wire.find( {
                            where: {
                                id: req.body.wire.parent_id,
                                type: 0
                            }
                        } )
                            .then( function( parentWire ){
                                if( parentWire ){
                                    Wire.find( {
                                        where: {
                                            parent_id: req.body.wire.parent_id,
                                            type: 1
                                        }
                                    } ).then( function( sameParentId ){
                                        if( !sameParentId ){
                                            var fee = math.round( Number( req.body.wire.fee ), 2 );
                                            var newWire = Wire.build( req.body.wire );
                                            newWire.currency_id = account.currency_id;
                                            newWire.company_id = account.company_id;
                                            newWire.name = hashids.encode( new Date().getTime() );
                                            newWire.status = 9;
                                            newWire.speedwire = 0;
                                            newWire.method = 0;
                                            newWire.confirmation = null;
                                            newWire.fee = fee;

                                            newWire.save().done( function( err, company ){
                                                if( err || _.isEmpty( company ) ){
                                                    _this.handleError( err, req, res );
                                                    return next();
                                                } else{
                                                    Company.find( newWire.company_id ).done( function( err, company ){
                                                        if( err || _.isEmpty( company ) ){
                                                            logger.metaLog( 'wire', 'Cannot find from company information', {
                                                                req: req
                                                            } );

                                                            logger.info( 'wire', 'wirein W-' + newWire.name + '[' + newWire.id + '] created by [' + req.body.wire.company_id + ']', {
                                                                req: req
                                                            } );
                                                        }
                                                        else{
                                                            logger.info( 'wire', 'wirein W-' + newWire.name + '[' + newWire.id + '] created by ' + company.name + ' [' + req.body.wire.company_id + ']', {
                                                                req: req
                                                            } );
                                                        }
                                                    } );
                                                    res.send( 201, { wire: newWire } );
                                                    return next();
                                                }
                                            } )
                                        }
                                        else{
                                            res.send( 400, {
                                                errors: [
                                                    'Already has existing return wire.'
                                                ]
                                            } );
                                            return next();
                                        }
                                    } )
                                }
                                else{
                                    res.send( 400, {
                                        errors: [
                                            'Cannot find original wire.'
                                        ]
                                    } );
                                    return next();
                                }
                            } )
                            .catch( function( err ){
                                _this.handleError( err, req, res );
                                return next();
                            } );
                    }
                    else{
                        var fee = math.round( Number( req.body.wire.fee ), 2 );
                        var newWire = Wire.build( req.body.wire );
                        newWire.currency_id = account.currency_id;
                        newWire.company_id = account.company_id;
                        newWire.name = hashids.encode( new Date().getTime() );
                        newWire.status = 0;
                        newWire.speedwire = 0;
                        newWire.method = 0;
                        newWire.confirmation = null;
                        newWire.fee = fee;

                        newWire.save().done( function( err, company ){
                            if( err || _.isEmpty( company ) ){
                                _this.handleError( err, req, res );
                                return next();
                            } else{
                                Company.find( newWire.company_id ).done( function( err, company ){
                                    if( err || _.isEmpty( company ) ){
                                        logger.metaLog( 'wire', 'Cannot find from company information', {
                                            req: req
                                        } );

                                        logger.info( 'wire', 'wirein W-' + newWire.name + '[' + newWire.id + '] created by [' + req.body.wire.company_id + ']', {
                                            req: req
                                        } );
                                    }
                                    else{
                                        logger.info( 'wire', 'wirein W-' + newWire.name + '[' + newWire.id + '] created by ' + company.name + ' [' + req.body.wire.company_id + ']', {
                                            req: req
                                        } );
                                    }
                                } );
                                res.send( 201, { wire: newWire } );
                                return next();
                            }
                        } )
                    }
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};



exports.wireOut = function( req, res, next ){
    req.assert( 'wire', 'isObject' );
    req.assert( 'wire.account_id', 'isString' );
    req.assert( 'wire.amount', 'isNumber' );
    req.assert( 'wire.method', 'isNumber' );
    req.assert( 'wire.type', 'isNumber' );
    req.assert( 'wire.speedwire', 'isNumber' );

    if( _.isEmpty( req.validationErrors ) ){

        db.sequelize.transaction( function( t ){

            req.body.wire.amount = Number( req.body.wire.amount );

            _this.wireValidations( req.body.wire ).then( function( wire ){

                Account.find( {
                    where: [
                        { id: req.body.wire.account_id },
                        { type: 0 }
                    ],
                    include: [
                        { model: Company }
                    ]
                } )
                    .done( function( err, account ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else if( !account ){
                            res.send( 400, { errors: [ 'Account not found.' ] } );
                            logger.error( 'wire', 'account not found', {
                                req: req
                            } );
                            return next();
                        }
                        else{
                            var newWire = Wire.build( req.body.wire );
                            newWire.currency_id = account.currency_id;
                            newWire.company_id = account.company_id;
                            newWire.confirmation = null;
                            newWire.name = hashids.encode( new Date().getTime() );

                            if( account.company.dual_custody ){
                                newWire.first_user_id = "";
                                newWire.status = 4;
                            }
                            else{
                                newWire.status = 9;
                            }

                            // Fee
                            var fee = math.round( Number( req.body.wire.fee ), 2 );
                            newWire.fee = fee;

                            if( account.balance < newWire.amount + fee ){
                                t.rollback();
                                res.send( 400, { errors: [ 'Insufficient fund' ] } );
                                logger.error( 'wire', 'insufficient fund', {
                                    req: req
                                } );

                                return next();
                            }
                            else{
                                // Take money from Account
                                account.balance -= newWire.amount;
                                account.balance -= fee;
                                account.save( { transaction: t } ).done( function( err ){
                                    if( !!err ){
                                        t.rollback();
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else{

                                        // save new wire
                                        newWire.save( { transaction: t } ).done( function( err ){
                                            if( !!err ){
                                                t.rollback();
                                                _this.handleError( err, req, res );
                                                return next();
                                            }
                                            else{
                                                // get currency for fee_account_id
                                                Currency.find( account.currency_id ).done( function( err, currency ){
                                                    if( !!err ){
                                                        t.rollback();
                                                        _this.handleError( err, req, res );
                                                        return next();
                                                    }
                                                    else{
                                                        // Create Transaction(s)
                                                        var wireTransaction = Transaction.build( {
                                                            currency_id: account.currency_id,
                                                            from_account_id: account.id,
                                                            model: 'wire',
                                                            model_id: newWire.id,
                                                            amount: newWire.amount,
                                                            type: 4,
                                                            status: 0
                                                        } );

                                                        var chainer = new Sequelize.Utils.QueryChainer;

                                                        // create transactions
                                                        chainer.add( wireTransaction.save( { transaction: t } ) );

                                                        if( fee !== 0 ){
                                                            var feeTransaction = Transaction.build( {
                                                                parent_id: wireTransaction.id,
                                                                currency_id: account.currency_id,
                                                                from_account_id: account.id,
                                                                to_account_id: currency.fee_wire_account_id,
                                                                model: 'wire',
                                                                model_id: newWire.id,
                                                                amount: fee,
                                                                type: 3,
                                                                status: 0
                                                            } );

                                                            chainer.add( feeTransaction.save( { transaction: t } ) );
                                                        }

                                                        chainer.runSerially().done( function( err ){
                                                            if( !!err ){
                                                                t.rollback();
                                                                _this.handleError( err, req, res );
                                                                return next();
                                                            }
                                                            else{
                                                                return t.commit().then( function(){
                                                                    res.send( 201, { wire: newWire } );
                                                                    notifier.notifyCompany( 'akx-wire-out', req.body.wire.company_id, { wire_name: 'W-' + newWire.name, account_holder: newWire.account_holder }, req );
                                                                    logger.info( 'wire', 'wireout W-' + newWire.name + '[' + newWire.id + ']', {
                                                                        req: req
                                                                    } );
                                                                    return next();
                                                                } );
                                                            }
                                                        } );
                                                    }
                                                } );
                                            }
                                        } );
                                    }
                                } );
                            }
                        }
                    } );
            } ).catch( function( err ){
                res.send( 400, { errors: err } );
                return next();
            } );
        } );

    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.wireValidations = function( wire ){
    var promises = [];
    var errors = [];
    var validations = [
        { key: 'account_id', validation: _.isString, msg: 'Must be string' },
        { key: 'beneficiary_type', validation: _.isNumber, msg: 'Must be number' },
        { key: 'account_holder', validation: _.isString, msg: 'Must be string' },
        { key: 'account_number', validation: _.isString, msg: 'Must be string' },
        { key: 'account_holder_country', validation: _.isString, msg: 'Must be string' },
        { key: 'account_holder_address', validation: _.isString, msg: 'Must be string' },
        { key: 'account_holder_city', validation: _.isString, msg: 'Must be string' },

        { key: 'bank_city', validation: _.isString, msg: 'Must be string' },
        { key: 'bank_address', validation: _.isString, msg: 'Must be string' },
        { key: 'bank_state_province', validation: _.isString, msg: 'Must be string' },
        { key: 'bank_postal_code', validation: _.isString, msg: 'Must be string' },
        { key: 'bank_name', validation: _.isString, msg: 'Must be string' },
        { key: 'bank_country', validation: _.isString, msg: 'Must be string' },
        { key: 'amount', validation: _.isNumber, msg: 'Must be number' },
        { key: 'method', validation: _.isNumber, msg: 'Must be number' },
        { key: 'purpose', validation: _.isString, msg: 'Must be string' }
    ];


    if( wire.method === 1 ){
        validations.push(
            { key: 'code_aba', validation: _.isString, msg: 'Must be string' }
        );
    }

    if( wire.beneficiary_type === 0 ){
        validations.push(
            { key: 'account_holder_dob', validation: _.isString, msg: 'Must be string' },
            { key: 'account_holder_nationality', validation: _.isString, msg: 'Must be string' }
        );
    }

    if( wire.code_aba ){
        if( !brnv.ABARoutingNumberIsValid( wire.code_aba ) || wire.code_aba.length !== 9 ){
            errors.push( 'Invalid ABA/Routing number' );
        }
        else{
            promises.push( _this.validABAMethod( wire.code_aba, wire.method, errors ) );
        }
    }

    if( !_.isEmpty( wire.intermediary_bank_name ) || !_.isEmpty( wire.intermediary_bank_code_aba || !_.isEmpty( wire.intermediary_bank_code_swift || !_.isEmpty( wire.intermediary_bank_country ) ) ) ){
        if( wire.type === 0 && wire.currency_id === 'USD' && wire.method === 0 ){
            validations.push(
                { key: 'intermediary_bank_name', validation: _.isString, msg: 'Must be string' },
                { key: 'intermediary_bank_country', validation: _.isString, msg: 'Must be string' }
            );

            if( wire.intermediary_bank_country === 'US' ){
                if( !wire.intermediary_bank_code_aba && !wire.intermediary_bank_code_swift ){
                    errors.push( 'Intermediary Bank ABA/Routing number or SWIFT code is required' );
                }
            }
            else{
                if( !wire.intermediary_bank_code_swift ){
                    errors.push( 'Intermediary Bank SWIFT code is required' );
                }
            }

            if( wire.intermediary_bank_code_aba ){
                if( !brnv.ABARoutingNumberIsValid( wire.intermediary_bank_code_aba ) || wire.intermediary_bank_code_aba.length !== 9 ){
                    errors.push( 'Invalid Intermediary ABA/Routing number' );
                }
                else{
                    promises.push( _this.validABAMethod( wire.intermediary_bank_code_aba, wire.method, errors ) );

                }
            }

            if( wire.intermediary_bank_code_swift && !ibantools.isValidBIC( wire.intermediary_bank_code_swift ) ){
                errors.push( 'Invalid Intermediary SWIFT code' );
            }

            if( !_.isEmpty( wire.intermediary_bank_address ) ){
                validations.push(
                    { key: 'intermediary_bank_address', validation: _.isString, msg: 'Must be string' }
                )
            }
            if( !_.isEmpty( wire.intermediary_bank_city ) ){
                validations.push(
                    { key: 'intermediary_bank_city', validation: _.isString, msg: 'Must be string' }
                )
            }
            if( !_.isEmpty( wire.intermediary_bank_state_province ) ){
                validations.push(
                    { key: 'intermediary_bank_state_province', validation: _.isString, msg: 'Must be string' }
                )
            }
            if( !_.isEmpty( wire.intermediary_bank_postal_code ) ){
                validations.push(
                    { key: 'intermediary_bank_postal_code', validation: _.isString, msg: 'Must be string' }
                )
            }
        }
    }

    _.forEach( validations, function( value, key ){
        var errObj = {};
        if( wire.hasOwnProperty( value.key ) ){
            if( !value[ 'validation' ]( wire[ value.key ] ) ){
                errObj[ key ] = value.msg;
                errors.push( errObj );
            }
        }
        else{
            errObj[ key ] = 'Required';
            errors.push( errObj );
        }
    } );

    // Error checking for WIRE validations
    if( wire.method === 0 ){
        if( wire.amount <= 0 ){
            errors.push( 'invalid amount' );
        }
        if( wire.bank_country === 'US' ){
            if( !wire.code_aba && !wire.code_swift ){
                errors.push( 'either ABA/Routing number or SWIFT code is required' );
            }
        }
        else{
            if( !wire.code_swift ){
                errors.push( 'SWIFT code is required' );
            }
            if( wire.code_swift && !ibantools.isValidBIC( wire.code_swift ) ){
                errors.push( 'Invalid SWIFT code' );
            }
            //if( !wire.account_iban && wire.currency_id !== 'USD' ){
            //    errors.push( 'IBAN is required' );
            //}
            if( wire.account_iban && !ibantools.isValidIBAN( wire.account_iban ) ){
                errors.push( 'Invalid IBAN' );
            }
        }
    }

    // Error checking for ACH validations
    else if( wire.method === 1 ){
        if( wire.amount <= 0 || wire.amount > 3000 || wire.bank_country !== 'US' || wire.currency_id !== 'USD' ){
            errors.push( 'ACH only supports transfers less than $3,000 to a U.S based financial institution' );
        }
    }
    else{
        errors.push( 'invalid money transfer method' );
    }

    return Promise.all( promises ).then( function(){
        if( _.isEmpty( errors ) ){
            return Promise.resolve();
        }
        else{
            return Promise.reject( errors );
        }
    } );
};

exports.validABAMethod = function( abaNum, method, errors ){
    var whereCond = {
        id: abaNum
    };

    if( method === 0 ){
        whereCond[ 'wire' ] = 1;
    }
    else if( method === 1 ){
        whereCond[ 'ach' ] = 1;
    }
    else{
        return Promise.resolve( errors.push( 'Invalid ABA/Routing number for payment method' ) );
    }

    return Bank.find( {
        where: whereCond
    } ).then( function( bankFound ){
        if( !bankFound ){
            return errors.push( 'Invalid ABA/Routing number for payment method' );
        }
    } )
};



exports.bookTransfer = function( req, res, next ){

    req.assert( 'wire', 'isObject' );
    req.assert( 'wire.account_id', 'isString' );
    req.assert( 'wire.account_number', 'isString' );
    req.assert( 'wire.amount', 'isNumber' );
    req.assert( 'wire.method', 'isNumber' );
    req.assert( 'wire.type', 'isNumber' );

    if( _.isEmpty( req.validationErrors ) ){
        db.sequelize.transaction( function( t ){

            req.body.wire.amount = Number( req.body.wire.amount );
            // Find the from Account
            Account.find( {
                where: [
                    { id: req.body.wire.account_id },
                    { type: 0 }
                ],
                include: [
                    {
                        model: Company
                    }
                ]
            } ).done( function( err, account ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !account ){
                    res.send( 400, { errors: [ 'From Account not found.' ] } );
                    logger.error( 'wire', 'account not found', {
                        req: req
                    } );
                    return next();
                }
                else if( account.company.status === 0 ){
                    res.send( 400, { errors: [ 'Closed company' ] } );
                    logger.error( 'wire', 'close company', {
                        req: req
                    } );
                    return next();
                }
                else if( req.body.wire.amount <= 0 ){
                    res.send( 400, {
                        errors: [
                            { 'wire.amount': [ 'Amount must be greater than 0' ] }
                        ]
                    } );
                    logger.error( 'wire', 'wire amount is 0', {
                        req: req
                    } );
                    return next();
                }
                else{
                    // Check if there are sufficient funds
                    var fee = math.round( Number( req.body.wire.fee ), 2 );
                    if( account.balance < req.body.wire.amount + fee ){
                        res.send( 400, { errors: [ 'Insufficient fund' ] } );

                        logger.error( 'wire', 'insufficient fund', {
                            req: req
                        } );

                        return next();
                    }
                    else{
                        // Find target company
                        Company.find( {
                            where: [
                                { account_number: req.body.wire.account_number }
                            ]
                        } ).done( function( err, toCompany ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else if( toCompany.status === 0 ){
                                res.send( 400, { errors: [ 'company XYZ' + req.body.wire.account_number ] + ' is closed' } );
                                return next();
                            }
                            else if( _.isEmpty( toCompany ) ){
                                res.send( 400, { errors: [ 'cannot find company for account XYZ' + req.body.wire.account_number ] } );
                                return next();
                            }
                            else if( toCompany.account_number === req.params.account_number ){
                                res.send( 400, { errors: [ 'Could not transfer to itself' ] } );
                                return next();
                            }
                            else if( toCompany.id === account.company.id){
                                res.send( 400, { errors: [ 'Cannot transfer to and from the same company' ] } );
                                return next();
                            }
                            else{
                                // Find target account
                                Account.find( {
                                    where: [
                                        {
                                            company_id: toCompany.id,
                                            currency_id: account.currency_id
                                        }
                                    ]
                                } ).done( function( err, toAccount ){
                                    if( !!err ){
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else{
                                        // Take money from sender's Account
                                        account.balance -= req.body.wire.amount;
                                        account.balance -= fee;
                                        account.save( { transaction: t } ).done( function( err ){
                                            if( !!err ){
                                                t.rollback();
                                                _this.handleError( err, req, res );
                                                return next();
                                            }
                                            else{

                                                // Create Wire
                                                var newWire = Wire.build( {
                                                    account_id: req.body.wire.account_id,
                                                    currency_id: account.currency_id,
                                                    company_id: account.company_id,
                                                    name: hashids.encode( new Date().getTime() ),
                                                    fee: fee,
                                                    status: 2,
                                                    type: req.body.wire.type,
                                                    method: 2,
                                                    notes: req.body.wire.notes,
                                                    bank_name: 'Internal Transfer',
                                                    account_holder: toCompany.name,
                                                    account_number: 'XYZ' + toCompany.account_number,
                                                    amount: req.body.wire.amount
                                                } );

                                                newWire.save( { transaction: t } ).done( function( err ){
                                                    if( !!err ){
                                                        t.rollback();
                                                        _this.handleError( err, req, res );
                                                        return next();
                                                    }
                                                    else{
                                                        Currency.find( account.currency_id ).done( function( err, currency ){
                                                            if( !!err ){
                                                                t.rollback();
                                                                _this.handleError( err, req, res );
                                                                return next();
                                                            }
                                                            else if( _.isEmpty( currency ) ){
                                                                t.rollback();
                                                                res.send( 400, { errors: [ 'Could not find the valid currency type.' ] } );
                                                                logger.error( 'wire', 'cannot find currency for account [' + account.id + ']', {
                                                                    req: req
                                                                } );
                                                                return next();
                                                            }
                                                            else{
                                                                // Create account for that currency
                                                                if( !toAccount ){
                                                                    toAccount = Account.build( {
                                                                        currency_id: account.currency_id,
                                                                        company_id: toCompany.id,
                                                                        name: account.currency_id + ' Account',
                                                                        balance: 0
                                                                    } );
                                                                    toAccount.save( { transaction: t } ).done( function( err ){
                                                                        if( !!err ){
                                                                            t.rollback();
                                                                            logger.error( 'wire', 'Failed [ON ADMIN] to create account for company ' + toCompany.name + ' [' + toCompany.id + ']', {
                                                                                req: req
                                                                            } );
                                                                        }
                                                                        else{
                                                                            // Create Transaction(s)
                                                                            var wireTransaction = Transaction.build( {
                                                                                currency_id: account.currency_id,
                                                                                from_account_id: account.id,
                                                                                to_account_id: toAccount.id,
                                                                                model: 'wire',
                                                                                model_id: newWire.id,
                                                                                amount: newWire.amount,
                                                                                type: 4,
                                                                                status: 0
                                                                            } );

                                                                            wireTransaction.save( { transaction: t } ).done( function( err ){
                                                                                if( !!err ){
                                                                                    t.rollback();
                                                                                    logger.error( 'wire', 'Failed [ON ADMIN] to create transaction for W-' + newWire.name + ' [' + newWire.id + ']', { req: req } );
                                                                                }
                                                                                else if( fee != 0 ){
                                                                                    var feeTransaction = Transaction.build( {
                                                                                        parent_id: wireTransaction.id,
                                                                                        currency_id: account.currency_id,
                                                                                        from_account_id: account.id,
                                                                                        to_account_id: currency.fee_wire_account_id,
                                                                                        model: 'wire',
                                                                                        model_id: newWire.id,
                                                                                        amount: fee,
                                                                                        type: 3,
                                                                                        status: 0
                                                                                    } );
                                                                                    feeTransaction.save( { transaction: t } ).done( function( err ){
                                                                                        if( !!err ){
                                                                                            t.rollback();
                                                                                            logger.error( 'wire', 'Failed [ON ADMIN] to create fee transaction for W-' + newWire.name + ' [' + newWire.id + ']', { req: req } );
                                                                                        }
                                                                                    } );
                                                                                }

                                                                                t.commit();
                                                                                notifier.notifyCompany( 'akx-wire-book-transfer-sent', req.body.wire.company_id, { wire_name: 'W-' + newWire.name, account_holder: newWire.account_holder, to_company_name: toCompany.name + ' (XYZ' + toCompany.account_number + ')' }, req );
                                                                                notifier.notifyCompany( 'akx-wire-book-transfer-received', toCompany.id, { wire_name: 'W-' + newWire.name, account_holder: newWire.account_holder, from_company_name: account.company.name + ' (XYZ' + account.company.account_number + ')' }, req );

                                                                                logger.info( 'wire', 'internal-transfer W-' + newWire.name + '[' + newWire.id + ']', {
                                                                                    req: req
                                                                                } );

                                                                                res.send( 201, { wire: newWire } );
                                                                                return next();
                                                                            } );
                                                                        }
                                                                    } );
                                                                }
                                                                // Existing account in that currency
                                                                else{

                                                                    // Create Transaction(s)
                                                                    var wireTransaction = Transaction.build( {
                                                                        currency_id: account.currency_id,
                                                                        from_account_id: account.id,
                                                                        to_account_id: toAccount.id,
                                                                        model: 'wire',
                                                                        model_id: newWire.id,
                                                                        amount: newWire.amount,
                                                                        type: 4,
                                                                        status: 0
                                                                    } );

                                                                    wireTransaction.save( { transaction: t } ).done( function( err ){
                                                                        if( !!err ){
                                                                            t.rollback();
                                                                            logger.error( 'wire', 'Failed [ON ADMIN] to create transaction for W-' + newWire.name + ' [' + newWire.id + ']', { req: req } );
                                                                        }
                                                                        else if( fee != 0 ){
                                                                            var feeTransaction = Transaction.build( {
                                                                                parent_id: wireTransaction.id,
                                                                                currency_id: account.currency_id,
                                                                                from_account_id: account.id,
                                                                                to_account_id: currency.fee_wire_account_id,
                                                                                model: 'wire',
                                                                                model_id: newWire.id,
                                                                                amount: fee,
                                                                                type: 3,
                                                                                status: 0
                                                                            } );
                                                                            feeTransaction.save( { transaction: t } ).done( function( err ){
                                                                                if( !!err ){
                                                                                    t.rollback();
                                                                                    logger.error( 'wire', 'Failed [ON ADMIN] to create fee transaction for W-' + newWire.name + ' [' + newWire.id + ']', { req: req } );
                                                                                }
                                                                            } );
                                                                        }

                                                                        t.commit();
                                                                        notifier.notifyCompany( 'akx-wire-book-transfer-sent', req.body.wire.company_id, { wire_name: 'W-' + newWire.name, account_holder: newWire.account_holder, to_company_name: toCompany.name + ' (XYZ' + toCompany.account_number + ')' }, req );
                                                                        notifier.notifyCompany( 'akx-wire-book-transfer-received', toCompany.id, { wire_name: 'W-' + newWire.name, account_holder: newWire.account_holder, from_company_name: account.company.name + ' (XYZ' + account.company.account_number + ')' }, req );

                                                                        logger.info( 'wire', 'internal-transfer W-' + newWire.name + '[' + newWire.id + ']', {
                                                                            req: req
                                                                        } );
                                                                        res.send( 201, { wire: newWire } );
                                                                        return next();
                                                                    } );
                                                                }
                                                            }
                                                        } );
                                                    }
                                                } );
                                            }
                                        } );
                                    }
                                } );
                            }
                        } );
                    }
                }
            } );

        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};






exports.cancel = function( req, res, next ){

    req.assert( 'wire_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        db.sequelize.transaction( function( t ){

            Wire.find( {
                where: [
                    { id: req.params.wire_id }
                ]
            } ).done( function( err, wire ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !wire ){
                    res.send( 404 );
                    return next();
                }
                else{
                    if( wire.status === 4 || wire.status === 0 || wire.status === 9 ){

                        // Wire Out
                        if( wire.type === 0 ){
                            wire.wire_batch_id = null;
                            wire.status = 3;

                            wire.save( { transaction: t } ).done( function( err, wire ){
                                if( !!err ){
                                    t.rollback();
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else{
                                    // Revert pending debit transactions
                                    var chainer = new Sequelize.Utils.QueryChainer;
                                    chainer.add( Transaction.findAll( {
                                        where: [
                                            { model: 'wire' },
                                            { model_id: wire.id },
                                            { from_account_id: wire.account_id },
                                            { status: 0 }
                                        ]
                                    } ) );
                                    chainer.add( Account.find( wire.account_id ) );
                                    chainer.runSerially().done( function( err, results ){
                                        if( !!err ){
                                            t.rollback();
                                            _this.handleError( err, req, res );
                                            return next();
                                        }
                                        else{
                                            var transactions = results[ 0 ];
                                            var fromAccount = results[ 1 ];

                                            _.forEach( transactions, function( trans ){
                                                fromAccount.balance += trans.amount;
                                                trans.status = 2;
                                                trans.save( { transaction: t } ).done( function( err ){
                                                    if( !!err ){
                                                        t.rollback();
                                                        logger.error( 'wire', 'failed status update to transaction [' + trans.id + ']', {
                                                            req: req
                                                        } );
                                                    }
                                                } );
                                            } );

                                            fromAccount.save( { transaction: t } ).done( function( err ){
                                                if( !!err ){
                                                    t.rollback();
                                                    _this.handleError( err, req, res );
                                                    return next();
                                                }
                                                else{
                                                    notifier.notifyCompany( 'akx-wire-cancel', wire.company_id, { wire_name: 'W-' + wire.name }, req );
                                                    logger.info( 'wire', 'cancelled W-' + wire.name + '[' + wire.id + ']', {
                                                        req: req
                                                    } );
                                                    t.commit();
                                                    res.send( 200, { wire: wire } );
                                                    return next();
                                                }
                                            } );
                                        }
                                    } );
                                }
                            } );
                        }
                        // Wire In
                        else if( wire.type === 1 ){
                            wire.status = 3;
                            wire.save( { transaction: t } ).done( function( err, wire ){
                                if( !!err ){
                                    t.rollback();
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else{
                                    notifier.notifyCompany( 'akx-wire-cancel', wire.company_id, { wire_name: 'W-' + wire.name }, req );
                                    logger.info( 'wire', 'cancelled W-' + wire.name + '[' + wire.id + ']', {
                                        req: req
                                    } );
                                    t.commit();
                                    res.send( 200, { wire: wire } );
                                    return next();
                                }
                            } );
                        }
                        // Internal
                        else{
                            t.rollback();
                            res.send( 403 );
                            return next();
                        }
                    }
                    else{
                        t.rollback();
                        res.send( 400, { errors: [ 'Request status does not allow this action.' ] } );
                        return next();
                    }
                }
            } );

        } );

    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};


exports.reject = function( req, res, next ){

    req.assert( 'wire_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        db.sequelize.transaction( function( t ){

            Wire.find( {
                where: [
                    { id: req.params.wire_id }
                ]
            } ).done( function( err, wire ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !wire ){
                    res.send( 404 );
                    return next();
                }
                else{
                    if( wire.status === 4 ){
                        // Wire Out
                        if( wire.type === 0 ){

                            wire.status = 5;

                            wire.save( { transaction: t } ).done( function( err, wire ){
                                if( !!err ){
                                    t.rollback();
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else{
                                    // Revert pending debit transactions
                                    var chainer = new Sequelize.Utils.QueryChainer;
                                    chainer.add( Transaction.findAll( {
                                        where: [
                                            { model: 'wire' },
                                            { model_id: wire.id },
                                            { from_account_id: wire.account_id },
                                            { status: 0 }
                                        ]
                                    } ) );
                                    chainer.add( Account.find( wire.account_id ) );
                                    chainer.runSerially().done( function( err, results ){
                                        if( !!err ){
                                            t.rollback();
                                            _this.handleError( err, req, res );
                                            return next();
                                        }
                                        else{
                                            var transactions = results[ 0 ];
                                            var fromAccount = results[ 1 ];

                                            _.forEach( transactions, function( trans ){
                                                fromAccount.balance += trans.amount;
                                                trans.status = 2;
                                                trans.save( { transaction: t } ).done( function( err ){
                                                    if( !!err ){
                                                        t.rollback();
                                                        logger.error( 'wire', 'failed status update to transaction [' + trans.id + ']', {
                                                            req: req
                                                        } );
                                                    }
                                                } );
                                            } );

                                            fromAccount.save( { transaction: t } ).done( function( err ){
                                                if( !!err ){
                                                    t.rollback();
                                                    _this.handleError( err, req, res );
                                                    return next();
                                                }
                                                else{
                                                    notifier.notifyCompany( 'akx-wire-reject', wire.company_id, { wire_name: 'W-' + wire.name }, req );
                                                    logger.info( 'wire', 'rejected W-' + wire.name + '[' + wire.id + ']', {
                                                        req: req
                                                    } );
                                                    t.commit();
                                                    res.send( 200, { wire: wire } );
                                                    return next();
                                                }
                                            } );
                                        }
                                    } );
                                }
                            } );
                        }
                        else{
                            t.rollback();
                            res.send( 403 );
                            return next();
                        }
                    }
                    else{
                        t.rollback();
                        res.send( 400, { errors: [ 'Request status does not allow this action.' ] } );
                        return next();
                    }
                }
            } );

        } );

    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};


exports.complete = function( req, res, next ){
    req.assert( 'wire_id', 'isString' );
    req.assert( 'data', 'isObject' );
    req.assert( 'data.confirmation', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Wire.find( {
            where: { id: req.params.wire_id }
        } )
            .done( function( err, wire ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !wire ){
                    res.send( 404 );
                    return next();
                }
                else if( wire.type === 0 && wire.status !== 1 ){
                    res.send( 400, { errors: [ 'Invalid wire status' ] } );
                    return next();
                }
                else if( wire.type === 1 && wire.status !== 0 ){
                    res.send( 400, { errors: [ 'Invalid wire status' ] } );
                    return next();
                }
                else{
                    return Company.find( {
                        where: {
                            id: wire.company_id
                        }
                    } ).then( function( company ){
                        if( _.isEmpty( company ) ){
                            res.send( 400, { errors: [ 'Company is not found' ] } );
                            return next();
                        }
                        else if( company.status === 0 ){
                            res.send( 400, { errors: [ 'Company is closed' ] } );
                            return next();
                        }
                        else{
                            switch( wire.type ){
                                case 0:
                                    exports.completeWireOut( req, res, next, wire );
                                    break;
                                case 1:
                                    // Find active preferred account number check if it's TM Wire
                                    if( !_.isEmpty( wire.preferred_account_number ) ){
                                        AccountAlias.find( {
                                            where: {
                                                name: wire.preferred_account_number,
                                                status: 1
                                            },
                                            include: [
                                                {
                                                    model: Account,
                                                    include: { model: Currency }
                                                },
                                                {
                                                    model: Company,
                                                    include: { model: Fee }
                                                },
                                                {
                                                    model: Account,
                                                    as: 'clientAccount',
                                                    include: { model: Currency }
                                                },
                                                {
                                                    model: Company,
                                                    as: 'clientCompany',
                                                    include: { model: Fee }
                                                }
                                            ]
                                        } ).then( function( accountAlias ){
                                            if( accountAlias && !_.isEmpty( accountAlias.client_account_id ) && !_.isEmpty( accountAlias.client_company_id ) ){
                                                exports.completeTMWireIn( req, res, next, wire, accountAlias );
                                            }
                                            else if( accountAlias && accountAlias.model === 'node' && !_.isEmpty( accountAlias.model_id ) ){
                                                exports.completeSmartWireIn( req, res, next, wire, accountAlias );
                                            }
                                            else{
                                                exports.completeWireIn( req, res, next, wire );
                                            }
                                        } );
                                    }
                                    else{
                                        exports.completeWireIn( req, res, next, wire );
                                    }
                                    break;
                                default:
                                    res.send( 400, { errors: [ 'Invalid wire type' ] } );
                                    return next();
                            }
                        }
                    } ).catch( function( err ){
                        util.handleValidationErrors( req, res );
                        return next();
                    } );


                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};


exports.completeWireOut = function( req, res, next, wire ){
    db.sequelize.transaction( function( t ){
        wire.values.status = 2;
        wire.values.confirmation = req.params.data.confirmation;
        wire.save( { transaction: t } ).done( function( err, wire ){
            if( !!err ){
                t.rollback();
                _this.handleError( err, req, res );
                return next();
            }
            else{
                t.commit();
                notifier.notifyCompany( 'akx-wire-out-completed', wire.company_id, { wire_name: 'W-' + wire.name, account_holder: wire.account_holder }, req );
                logger.info( 'wire', 'completed wire out W-' + wire.name + '[' + wire.id + ']', {
                    req: req
                } );
                res.send( 200, { wire: wire } );
                return next();
            }
        } );

    } );

};

exports.completeWireIn = function( req, res, next, wire ){
    req.assert( 'data.account_id', 'isString' );
    req.assert( 'data.company_id', 'isString' );
    req.assert( 'data.fee', 'isNumber' );

    if( _.isEmpty( req.validationErrors ) ){

        db.sequelize.transaction( function( t ){

            Account.find( {
                where: { id: req.params.data.account_id },
                include: { model: Currency }
            } )
                .done( function( err, account ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else if( !account ){
                        res.send( 400, { errors: [ 'Invalid account' ] } );
                        return next();
                    }
                    else if( account.company_id !== req.params.data.company_id ){
                        res.send( 400, { errors: [ 'Company and account mismatch' ] } );
                        return next();
                    }
                    else if( account.currency_id !== wire.currency_id ){
                        res.send( 400, { errors: [ 'Mismatch currency type' ] } );
                        return next();
                    }
                    else{
                        wire.values.status = 2;
                        wire.values.confirmation = req.params.data.confirmation;
                        wire.values.account_id = req.params.data.account_id;
                        wire.values.company_id = req.params.data.company_id;
                        wire.values.amount = req.params.data.amount;
                        wire.values.fee = req.params.data.fee;
                        wire.values.reference = req.params.data.reference;
                        wire.values.raw_data = req.params.data.raw_data;

                        // Create Transaction(s)
                        var wireTransaction = Transaction.build( {
                            currency_id: account.currency_id,
                            to_account_id: account.id,
                            model: 'wire',
                            model_id: wire.id,
                            amount: wire.amount,
                            type: 4,
                            status: 0
                        } );

                        var chainer = new Sequelize.Utils.QueryChainer;

                        // create transactions
                        chainer.add( wireTransaction.save( { transaction: t } ) );

                        if( wire.values.fee !== 0 ){
                            var feeTransaction = Transaction.build( {
                                parent_id: wireTransaction.id,
                                currency_id: account.currency_id,
                                from_account_id: account.id,
                                to_account_id: account.currency.fee_wire_account_id,
                                model: 'wire',
                                model_id: wire.id,
                                amount: wire.fee,
                                type: 3,
                                status: 0
                            } );

                            chainer.add( feeTransaction.save( { transaction: t } ) );
                        }

                        chainer.runSerially().done( function( err ){
                            if( !!err ){
                                t.rollback();
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else{
                                wire.save( { transaction: t } ).done( function( err, wire ){
                                    if( !!err ){
                                        t.rollback();
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else{
                                        t.commit();
                                        notifier.notifyCompany( 'akx-wire-in-completed', wire.company_id, { wire_name: 'W-' + wire.name }, req );
                                        logger.info( 'wire', 'completed wire in W-' + wire.name + '[' + wire.id + ']', {
                                            req: req
                                        } );
                                        res.send( 200, { wire: wire } );
                                        return next();
                                    }
                                } );
                            }
                        } );


                    }
                } );

        } );


    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.completeTMWireIn = function( req, res, next, wire, accountAlias ){
    CompanyRelationship.find( {
        where: {
            company_id: accountAlias.client_company_id,
            institution_id: accountAlias.company_id,
            status: 1
        }
    } ).then( function( compRel ){
        if( !compRel ){
            res.send( 400, { errors: [ 'Invalid AccountAlias / CompanyRelationship' ] } );
            return next();
        }
        else{
            if( wire.currency_id !== accountAlias.account.currency_id || wire.currency_id !== accountAlias.clientAccount.currency_id ){
                res.send( 400, { errors: [ 'Accounts currency and wire currency do not match' ] } );
                return next();
            }
            if( accountAlias.company.id !== accountAlias.account.company_id || accountAlias.clientCompany.id !== accountAlias.clientAccount.company_id ){
                res.send( 400, { errors: [ 'Accounts ownership does not match' ] } );
                return next();
            }
            else if( wire.amount <= wire.fee ){
                res.send( 400, { errors: [ 'Insufficient amount to cover the wire fee' ] } );
                return next();
            }
            else{
                db.sequelize.transaction( function( t ){
                    var promises = [];

                    wire.company_id = accountAlias.clientCompany.id;
                    wire.account_id = accountAlias.clientAccount.id;
                    wire.status = 2;
                    promises.push( wire.save( { transaction: t } ) );

                    var wireTransaction = Transaction.build( {
                        currency_id: accountAlias.clientAccount.currency_id,
                        to_account_id: accountAlias.clientAccount.id,
                        model: 'wire',
                        model_id: wire.id,
                        amount: wire.amount,
                        type: 4,
                        status: 1
                    } );

                    promises.push( wireTransaction.save( { transaction: t } ) );

                    if( wire.fee !== 0 ){
                        var feeTransaction = Transaction.build( {
                            parent_id: wireTransaction.id,
                            currency_id: accountAlias.clientAccount.currency_id,
                            from_account_id: accountAlias.clientAccount.id,
                            to_account_id: accountAlias.clientAccount.currency.fee_wire_account_id,
                            model: 'wire',
                            model_id: wire.id,
                            amount: wire.fee,
                            type: 3,
                            status: 0
                        } );

                        promises.push( feeTransaction.save( { transaction: t } ) );
                    }

                    var invoiceAmount = math.round( wire.amount - wire.fee, 2 );
                    //var leftoverAmount = math.round( wire.amount - wire.fee, 2 );
                    //var invoiceAmount = math.round( leftoverAmount / ( 1 + accountAlias.company.fee.getTMInvoiceInRate( accountAlias.clientAccount.currency_id, wire.amount ) ), 2 );
                    //var invoiceFee = math.round( leftoverAmount - invoiceAmount, 2 );

                    var newInvoice = Invoice.build( {
                        name: invoiceNameHasher.encode( new Date().getTime() ),
                        invoice_date: moment.utc().format(),
                        invoice_period_from: null,
                        invoice_period_to: null,
                        title: 'W-' + wire.name + ' Invoice',
                        company_id: accountAlias.company.id,
                        to_company_id: accountAlias.clientCompany.id,
                        node_id: null,
                        project_id: null,
                        account_id: accountAlias.account.id,
                        currency_id: accountAlias.clientAccount.currency_id,
                        parent_id: null,
                        tax_rate: 0,
                        amount: invoiceAmount,
                        type: 3,
                        status: 3,
                        notes: wire.raw_data

                    } );

                    promises.push( newInvoice.save( { transaction: t } ) );


                    var newItem1 = InvoiceItem.build( {
                        name: 'W-' + wire.name,
                        unit: null,
                        price: wire.amount,
                        quantity: 1,
                        invoice_id: newInvoice.id
                    } );
                    promises.push( newItem1.save( { transaction: t } ) );

                    if( wire.fee !== 0 ){
                        var newItem2 = InvoiceItem.build( {
                            name: 'Wire Fee',
                            unit: null,
                            price: math.round( -1.00 * wire.fee, 2 ),
                            quantity: 1,
                            invoice_id: newInvoice.id
                        } );
                        promises.push( newItem2.save( { transaction: t } ) );
                    }

                    //if( invoiceFee !== 0 ){
                    //    var newItem3 = InvoiceItem.build( {
                    //        name: 'TM Surcharge',
                    //        unit: null,
                    //        price: math.round( -1.00 * invoiceFee, 2 ),
                    //        quantity: 1,
                    //        invoice_id: newInvoice.id
                    //    } );
                    //    promises.push( newItem3.save( { transaction: t } ) );
                    //}

                    var invoiceTransaction = Transaction.build( {
                        currency_id: accountAlias.clientAccount.currency_id,
                        from_account_id: accountAlias.clientAccount.id,
                        to_account_id: accountAlias.account.id,
                        model: 'invoice',
                        model_id: newInvoice.id,
                        amount: invoiceAmount,
                        type: 1,
                        status: 1
                    } );

                    promises.push( invoiceTransaction.save( { transaction: t } ) );

                    //if( invoiceFee != 0 ){
                    //    var feeTransaction = Transaction.build( {
                    //        currency_id: accountAlias.clientAccount.currency_id,
                    //        from_account_id: accountAlias.clientAccount.id,
                    //        to_account_id: accountAlias.clientAccount.currency.fee_invoice_account_id,
                    //        parent_id: invoiceTransaction.id,
                    //        model: 'invoice',
                    //        model_id: newInvoice.id,
                    //        amount: invoiceFee,
                    //        type: 3,
                    //        status: 0
                    //    } );
                    //    promises.push( feeTransaction.save( { transaction: t } ) );
                    //}

                    promises.push( accountAlias.account.balanceAdd( math.round( invoiceAmount, 2 ), t ) );

                    Promise.all( promises ).then( function( results ){
                        t.commit();
                        logger.info( 'wire', 'completed TM wire in W-' + wire.name + '[' + wire.id + ']', {
                            req: req
                        } );
                        res.send( 200, { wire: wire } );
                        return next();
                    } ).catch( function( err ){
                        t.rollback();
                        _this.handleError( err, req, res );
                        return next();
                    } )
                } );
            }
        }
    } ).catch( function( err ){
        _this.handleError( err, req, res );
        return next();
    } )
};


exports.completeSmartWireIn = function( req, res, next, wire, accountAlias ){
    req.assert( 'data.account_id', 'isString' );
    req.assert( 'data.company_id', 'isString' );
    req.assert( 'data.fee', 'isNumber' );

    if( _.isEmpty( req.validationErrors ) ){

        db.sequelize.transaction( function( t ){

            Account.find( {
                where: { id: req.params.data.account_id },
                include: { model: Currency }
            } )
                .done( function( err, account ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else if( !account ){
                        res.send( 400, { errors: [ 'Invalid account' ] } );
                        return next();
                    }
                    else if( account.company_id !== req.params.data.company_id ){
                        res.send( 400, { errors: [ 'Company and account mismatch' ] } );
                        return next();
                    }
                    else if( account.currency_id !== wire.currency_id ){
                        res.send( 400, { errors: [ 'Mismatch currency type' ] } );
                        return next();
                    }
                    else{
                        wire.values.status = 2;
                        wire.values.confirmation = req.params.data.confirmation;
                        wire.values.account_id = req.params.data.account_id;
                        wire.values.company_id = req.params.data.company_id;
                        wire.values.amount = req.params.data.amount;
                        wire.values.fee = req.params.data.fee;
                        wire.values.reference = req.params.data.reference;
                        wire.values.raw_data = req.params.data.raw_data;

                        // Create Transaction(s)
                        var wireTransaction = Transaction.build( {
                            currency_id: account.currency_id,
                            to_account_id: account.id,
                            model: 'wire',
                            model_id: wire.id,
                            amount: wire.amount,
                            type: 4,
                            status: 1
                        } );

                        var chainer = new Sequelize.Utils.QueryChainer;

                        // create transactions
                        chainer.add( wireTransaction.save( { transaction: t } ) );

                        if( wire.values.fee !== 0 ){
                            var feeTransaction = Transaction.build( {
                                parent_id: wireTransaction.id,
                                currency_id: account.currency_id,
                                from_account_id: account.id,
                                to_account_id: account.currency.fee_wire_account_id,
                                model: 'wire',
                                model_id: wire.id,
                                amount: wire.fee,
                                type: 3,
                                status: 0
                            } );

                            chainer.add( feeTransaction.save( { transaction: t } ) );
                        }

                        account.balance = account.balance + wire.amount - wire.fee;
                        chainer.add( account.save( { transaction: t } ) );

                        chainer.runSerially().done( function( err ){
                            if( !!err ){
                                t.rollback();
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else{
                                wire.save( { transaction: t } ).done( function( err, wire ){
                                    if( !!err ){
                                        t.rollback();
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else{
                                        t.commit().then( function(){
                                            // Commit to Node
                                            var availableAmount = wire.amount - wire.fee;
                                            return _this.commitFunds( accountAlias.model_id, availableAmount, 0, t ).then( function(){
                                                t.commit();
                                                //notifier.notifyCompany( 'akx-wire-in-completed', wire.company_id, { wire_name: 'W-' + wire.name }, req );
                                                logger.info( 'wire', 'completed wire in W-' + wire.name + '[' + wire.id + ']', {
                                                    req: req
                                                } );
                                                res.send( 200, { wire: wire } );
                                                return next();
                                            } ).catch( function( err ){
                                                t.rollback();
                                                _this.handleError( err, req, res );
                                                return next();
                                            } );
                                        } );
                                    }
                                } );
                            }
                        } );


                    }
                } );

        } );


    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.commitFunds = function( parentNodeId, cashAvailable, pointsAvailable, t ){
    var parentNode;
    var childNode;
    var PCAmount = 0;
    var PAmount = 0;
    return Node.find( {
        where: [
            {
                id: parentNodeId,
                status: 1
            }
        ],
        include: [
            {
                model: Company,
                include: [
                    { model: Fee }
                ]
            },
            { model: Account }
        ]
    } ).then( function( pNode ){
        parentNode = pNode;
        return Node.find( {
            where: [
                {
                    parent_id: parentNodeId,
                    status: 1
                }
            ]
        } );
    } ).then( function( cNode ){
        if( _.isEmpty( cNode ) ){
            // Terminating condition is when current node has no child
            return;
        }
        else{
            var promises = [];
            childNode = cNode;
            PCAmount = math.round( cashAvailable * ( 1 - ( parentNode.discount_rate / 100 ) - Number( parentNode.company.fee.getInvoiceOutRate() ) ), 2 );
            PAmount = math.round( pointsAvailable * ( 1 - ( parentNode.discount_rate / 100 ) ), 2 );

            if( PCAmount !== 0 ){
                var PCTrans = Transaction.build( {
                    currency_id: parentNode.account.currency_id,
                    from_account_id: parentNode.account.id,
                    model: 'node',
                    model_id: childNode.id,
                    amount: PCAmount,
                    status: 1,
                    type: 2
                } );
                promises.push( PCTrans.save( { transaction: t } ) );
                // Update account balance and childNode's points_cash
                parentNode.account.balance -= PCAmount;
                childNode.points_cash += PCAmount;
                PAmount = PCAmount;
                PCAmount = 0;
            }
            else if( PAmount !== 0 ){
                // Update account balance and childNode's points
                childNode.points += PAmount;
            }
            promises.push( parentNode.account.save( { transaction: t } ) );
            promises.push( childNode.save( { transaction: t } ) );
            return Promise.all( promises ).then( function(){
                return _this.commitFunds( childNode.id, PCAmount, PAmount, t );
            } );
        }
    } )
};





exports.undo = function( req, res, next ){
    req.assert( 'wire_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Wire.find( {
            where: {
                id: req.params.wire_id,
                status: 2,
                type: 1
            }
        } ).done( function( err, wire ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !wire ){
                res.send( 404, { errors: [ 'Cannot find the wire' ] } );
                return next();
            }
            else{
                // Find fee transaction
                Transaction.find( {
                    where: [
                        { model: 'wire' },
                        { model_id: wire.id },
                        { status: 1 },
                        { type: 3 }
                    ]
                } ).done( function( err, feeTransaction ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else if( !feeTransaction ){
                        var chainer = new Sequelize.Utils.QueryChainer;
                        chainer.add( Account.find( wire.account_id ) );
                        chainer.add( Transaction.find( {
                            where: [
                                { model: 'wire' },
                                { model_id: wire.id },
                                { status: 1 },
                                { type: 4 }
                            ]
                        } ) );
                        chainer.run().done( function( err, results ){
                            var wireAccount = results[ 0 ];
                            var wireTransaction = results[ 1 ];
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else if( !wireAccount || !wireTransaction ){
                                res.send( 400, { errors: [ 'Wire has invalid account or transaction' ] } );
                                return next();
                            }
                            else if( wireAccount.balance < wireTransaction.amount ){
                                res.send( 400, { errors: [ 'Insufficient fund in the account to undo the wire.' ] } );
                                return next();
                            }
                            else{
                                db.sequelize.transaction( function( t ){
                                    wireTransaction.status = 2;
                                    wire.status = 0;
                                    var updateChainer = new Sequelize.Utils.QueryChainer;
                                    updateChainer.add( Account.update(
                                        {
                                            balance: wireAccount.balance - wireTransaction.amount
                                        },
                                        {
                                            id: wireAccount.id,
                                            balance: wireAccount.balance
                                        },
                                        { transaction: t }
                                    ) );
                                    updateChainer.add( wireTransaction.save( { transaction: t } ) );
                                    updateChainer.add( wire.save( { transaction: t } ) );
                                    updateChainer.runSerially().done( function( err, results ){
                                        if( !!err ){
                                            t.rollback();
                                            _this.handleError( err, req, res );
                                            return next();
                                        }
                                        else if( results[ 0 ] === 1 ){
                                            t.commit();
                                            res.send( 200, { wire: wire } );
                                            logger.info( 'wire', 'Undo wire', {
                                                req: req,
                                                model: 'wire',
                                                model_id: wire.id
                                            } );
                                            return next();
                                        }
                                        else{
                                            t.rollback();
                                            res.send( 400, { errors: [ 'An error has occurred' ] } );
                                            return next();
                                        }
                                    } )

                                } );
                            }
                        } );
                    }
                    else{
                        var chainer = new Sequelize.Utils.QueryChainer;
                        chainer.add( Account.find( feeTransaction.to_account_id ) );
                        chainer.add( Account.find( wire.account_id ) );
                        chainer.add( Transaction.find( {
                            where: [
                                { model: 'wire' },
                                { model_id: wire.id },
                                { status: 1 },
                                { type: 4 }
                            ]
                        } ) );
                        chainer.run().done( function( err, results ){
                            var feeAccount = results[ 0 ];
                            var wireAccount = results[ 1 ];
                            var wireTransaction = results[ 2 ];
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else if( !feeAccount || !wireAccount || !wireTransaction ){
                                res.send( 400, { errors: [ 'Wire has invalid account or transaction' ] } );
                                return next();
                            }
                            else if( feeAccount.balance < feeTransaction.amount || wireAccount.balance < wireTransaction.amount - feeTransaction.amount ){
                                res.send( 400, { errors: [ 'Insufficient fund in the account to undo the wire.' ] } );
                                return next();
                            }
                            else{
                                db.sequelize.transaction( function( t ){
                                    feeTransaction.status = 2;
                                    wireTransaction.status = 2;
                                    wire.status = 0;
                                    var updateChainer = new Sequelize.Utils.QueryChainer;
                                    updateChainer.add( Account.update(
                                        {
                                            balance: feeAccount.balance - feeTransaction.amount
                                        },
                                        {
                                            id: feeAccount.id,
                                            balance: feeAccount.balance
                                        },
                                        { transaction: t }
                                    ) );
                                    updateChainer.add( Account.update(
                                        {
                                            balance: wireAccount.balance - wireTransaction.amount + feeTransaction.amount
                                        },
                                        {
                                            id: wireAccount.id,
                                            balance: wireAccount.balance
                                        },
                                        { transaction: t }
                                    ) );
                                    updateChainer.add( feeTransaction.save( { transaction: t } ) );
                                    updateChainer.add( wireTransaction.save( { transaction: t } ) );
                                    updateChainer.add( wire.save( { transaction: t } ) );
                                    updateChainer.runSerially().done( function( err, results ){
                                        if( !!err ){
                                            t.rollback();
                                            _this.handleError( err, req, res );
                                            return next();
                                        }
                                        else if( results[ 0 ] === 1 && results[ 1 ] === 1 ){
                                            t.commit();
                                            res.send( 200, { wire: wire } );
                                            logger.info( 'wire', 'Undo wire', {
                                                req: req,
                                                model: 'wire',
                                                model_id: wire.id
                                            } );
                                            return next();
                                        }
                                        else{
                                            t.rollback();
                                            res.send( 400, { errors: [ 'An error has occurred' ] } );
                                            return next();
                                        }
                                    } )

                                } );
                            }
                        } );
                    }
                } )
            }
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};





exports.getPdf = function( req, res, next ){
    req.assert( 'wire_id', 'isString' );

    if( !_.isEmpty( req.validationErrors ) ){
        util.handleValidationErrors( req, res );
        return next();
    }
    else{
        Wire.find( {
            where: {
                id: req.params.wire_id
            },
            include: [
                { model: BankRoute },
                {
                    model: Company,
                    attributes: [ 'id', 'name', 'account_number', 'address', 'city', 'state_province', 'postal_code', 'phone', 'email' ]
                } ]
        } ).done( function( err, wire ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !wire ){
                res.send( 404 );
                return next();
            }

            else{
                request.post( {
                    url: pdfConfig.host + '/pdfs',
                    json: {
                        template_name: 'wire_confirmation',
                        data: {
                            wire: wire
                        }
                    }
                }, function( err, response, pdfBody ){
                    if( err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else{
                        if( response.statusCode !== 200 && response.statusCode !== 201 ){
                            res.send( 400, { errors: [ 'Error getting pdf' ] } );
                            return next();
                        }
                        else{
                            var fileName = 'W-' + wire.name + '.pdf';

                            res.setHeader( 'Content-Transfer-Encoding', 'base64' );
                            res.setHeader( 'Content-Description', 'File Transfer' );
                            res.setHeader( 'Content-Disposition', 'attachment; filename="' + fileName + '"' );
                            res.setHeader( 'Content-Type', 'application/pdf' );

                            var buffer = new Buffer( pdfBody.data, 'base64' );
                            res.send( 200, buffer );
                            return next();
                        }
                    }
                } );
            }
        } );
    }
};

exports.addToBatch = function( req, res, next ){

    req.assert( 'wire_id', 'isString' );
    req.assert( 'wire_batch_id', 'isString' );

    if( !_.isEmpty( req.validationErrors ) ){
        util.handleValidationErrors( req, res );
        return next();
    }
    else{

        db.sequelize.transaction( function( t ){

            WireBatch.find( {
                where: [
                    { id: req.params.wire_batch_id },
                    { status: 0 }
                ]
            } ).then( function( batch ){
                if( !batch ){
                    res.send( 400, { errors: [ 'Invalid batch' ] } );
                    return next();
                }
                else{
                    Wire.find( {
                        where: [
                            { id: req.params.wire_id },
                            { status: 0 }
                        ]
                    } )
                        .done( function( err, wire ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else if( !wire ){
                                res.send( 404 );
                                return next();
                            }
                            else if( !_.isEmpty( wire.confirmation ) ){
                                res.send( 400, { errors: [ 'Wire has confirmation info already' ] } );
                                return next();
                            }
                            else if( batch.currency_id !== null && batch.currency_id !== wire.currency_id ){
                                res.send( 400, { errors: [ 'Wire and batch currency_id mismatch' ] } );
                                return next();
                            }
                            else{
                                wire.status = 1;
                                wire.wire_batch_id = req.params.wire_batch_id;
                                wire.bank_route_id = batch.bank_route_id;
                                wire.save( { transaction: t } ).done( function( err ){
                                    if( !!err ){
                                        t.rollback();
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else{
                                        return t.commit().then( function(){
                                            res.send( 200, { wire: wire } );
                                            return next();
                                        } );
                                    }
                                } );
                            }
                        } );
                }
            } ).catch( function( err ){
                _this.handleError( err, req, res );
                return next();
            } );

        } );

    }
};

exports.removeFromBatch = function( req, res, next ){

    Wire.find( {
        where: [
            { id: req.params.wire_id }
        ]
    } ).then( function( wire ){
        if( !wire ){
            return res.send( 404 );
        }
        else if( _.isEmpty( wire.wire_batch_id ) ){
            return res.send( 400, { errors: [ 'wire is not in a batch' ] } );
        }
        else if( wire.status !== 0 && wire.status !== 1 ){
            return res.send( 400, { errors: [ 'wire is not of status 0 or 1' ] } );
        }
        else{
            WireBatch.find( {
                where: {
                    id: wire.wire_batch_id
                }
            } ).then( function( batch ){
                if( batch && batch.status !== 0 ){
                    return res.send( 400, { errors: [ 'wire-batch is not of status 0' ] } );
                }
                else{
                    var originalBatchId = wire.wire_batch_id;
                    Wire.update( {
                        status: 0,
                        wire_batch_id: null,
                        bank_route_id: null
                    }, { id: wire.id } ).then( function( updatedWire ){
                        akxLogger.info( 'removed wire ' + wire.id + ' from wire-batch ' + originalBatchId );
                        res.send( 200, { wire: updatedWire } );
                        return next();
                    } )
                }
            } ).catch( function( err ){
                return util.handleLibError( err, req, res, akxLogger );
            } )
        }
    } ).catch( function( err ){
        return util.handleLibError( err, req, res, akxLogger );
    } );
};

exports.dupCheck = function( req, res, next ){

    req.assert( 'company_id', 'isString' );

    if( !_.isEmpty( req.validationErrors ) ){
        util.handleValidationErrors( req, res );
        return next();
    }
    else{
        var fromDate = moment.utc().subtract( 3, 'days' ).format( 'YYYY-MM-DD 00:00:00' );
        var toDate = moment.utc().format( 'YYYY-MM-DD 23:59:59' );
        Wire.findAll( {
            where: [
                { company_id: req.params.company_id },
                { type: req.params.type },
                { amount: req.params.amount },
                { updated_at: { between: [ fromDate, toDate ] } }
            ]
        } ).done( function( err, wires ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                res.send( 200, { wires: wires } );
                return next();
            }
        } );
    }
};

exports.search = function( req, res, next ){

    req.assert( 'value', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        var queryParams = [];

        var query = {
            where: {},
            order: 'updated_at DESC'
        };

        req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
        req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );

        var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
        if( paged ){
            query.offset = ( req.params.page - 1 ) * req.params.per_page;
            query.limit = req.params.per_page;
        }

        req.params.value = req.params.value.trim();
        if( !_.isEmpty( req.params.value ) ){
            queryParams.push( { reference: { like: '%' + req.params.value + '%' } } );
            queryParams.push( { name: { like: '%' + req.params.value + '%' } } );
            queryParams.push( { account_holder: { like: '%' + req.params.value + '%' } } );
            queryParams.push( { amount: { like: '%' + req.params.value + '%' } } );
        }

        query.where = db.Sequelize.or.apply( _this, queryParams );


        Wire.findAndCountAll( query ).done( function( err, wires ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                var totalPages = 1;
                if( paged ){
                    var pageRatio = wires.count / req.params.per_page;
                    totalPages = Math.floor( pageRatio );
                    if( pageRatio % 1 > 0 ){
                        totalPages++;
                    }
                }
                res.send( 200, { wires: wires.rows, meta: { total_pages: totalPages } } );
                return next();
            }
        } );

    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};






exports.achRecall = function( req, res, next ){
    req.assert( 'wire_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        db.sequelize.transaction( function( t ){

            Wire.find( {
                where: {
                    id: req.params.wire_id
                }
            } ).then( function( wire ){
                if( !wire ){
                    res.send( 400, { errors: 'No Wire Found' } )
                }
                else{
                    Company.find( {
                        where: {
                            id: wire.company_id
                        }
                    } )
                        .then( function( company ){
                            if( !company ){
                                t.rollback();
                                res.send( 400, { errors: [ 'Company Not found' ] } );
                                return next();
                            }
                            else{
                                Account.find( {
                                    where: {
                                        id: wire.account_id,
                                        company_id: company.id,
                                        currency_id: wire.currency_id
                                    }
                                } )
                                    .then( function( account ){
                                        if( !account ){
                                            t.rollback();
                                            res.send( 400, { errors: [ 'Account Not found for Company ' + company.name ] } );
                                            return next();
                                        }
                                        else{
                                            Transaction.find( {
                                                where: {
                                                    model_id: req.params.wire_id,
                                                    model: 'wire'
                                                }
                                            } ).then( function( transactions ){
                                                if( !transactions ){
                                                    Currency.find( {
                                                        where: {
                                                            id: account.currency_id
                                                        }
                                                    } ).then( function( currency ){

                                                        if( !currency ){
                                                            t.rollback();
                                                            res.send( 400 );
                                                            return next();
                                                        }
                                                        else{
                                                            var wireTransaction = Transaction.build( {
                                                                currency_id: account.currency_id,
                                                                from_account_id: account.id,
                                                                model: 'wire',
                                                                model_id: wire.id,
                                                                amount: wire.amount,
                                                                type: 4,
                                                                status: 1
                                                            } );

                                                            var chainer = new Sequelize.Utils.QueryChainer;

                                                            // create transactions
                                                            chainer.add( wireTransaction.save( { transaction: t } ) );

                                                            var fee = math.round( Number( wire.fee ), 2 );

                                                            if( fee !== 0 ){
                                                                var feeTransaction = Transaction.build( {
                                                                    parent_id: wireTransaction.id,
                                                                    currency_id: account.currency_id,
                                                                    from_account_id: account.id,
                                                                    to_account_id: currency.fee_wire_account_id,
                                                                    model: 'wire',
                                                                    model_id: wire.id,
                                                                    amount: fee,
                                                                    type: 3,
                                                                    status: 1
                                                                } );

                                                                chainer.add( feeTransaction.save( { transaction: t } ) );
                                                            }

                                                            account.balance = account.balance - wire.amount - fee;
                                                            chainer.add( account.save( { transaction: t } ) );

                                                            chainer.runSerially().done( function( err ){
                                                                if( !!err ){
                                                                    t.rollback();
                                                                    _this.handleError( err, req, res );
                                                                    return next();
                                                                }
                                                                else{
                                                                    wire.status = 2;
                                                                    wire.save().done( function( err, updatedWire ){
                                                                        if( !!err ){
                                                                            t.rollback();
                                                                            _this.handleError( err, req, res );
                                                                            return next();
                                                                        }
                                                                        else{
                                                                            t.commit();
                                                                            res.send( 200, { wire: updatedWire } );
                                                                            return next();
                                                                        }
                                                                    } )


                                                                }
                                                            } );
                                                        }
                                                    } )
                                                }
                                                else{
                                                    t.rollback();
                                                    res.send( 400, { errors: [ 'Transactions were found' ] } );
                                                    return next();
                                                }
                                            } );
                                        }
                                    } );
                            }
                        } );
                }
            } );

        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};


exports.download = function( req, res, next ){

    req.assert( 'period_from', 'isString' );
    req.assert( 'period_to', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        var query;

        if( req.params.period_from && req.params.period_to ){
            query = "SELECT " +
                " wires.updated_at as 'Date'," +
                " wires.name as 'ID'," +
                " (CASE wires.type WHEN 0 THEN 'Wire Out' WHEN 1 THEN 'Wire In' WHEN 2 THEN 'Internal'  END) as 'Type'," +
                " (CASE wires.method WHEN 0 THEN 'Wire' WHEN 1 THEN 'ACH' WHEN 2 THEN 'Internal' END) as 'Method'," +
                " bank_routes.name as 'Bank Route'," +
                " IF(fcompanies.id='masterco-mpan-yisa-kiri-xtheidislong', 'Akirix', CONCAT('XYZ',fcompanies.account_number, ' ',fcompanies.name)) as 'Company'," +
                " wires.currency_id as 'Currency'," +
                " wires.amount as 'Amount', " +
                " wires.fee as 'Fee Amount', " +
                " wires.bank_name as 'Bank Name', " +
                " wires.bank_country as 'Country'," +
                " wires.code_swift as 'Swift'," +
                " wires.code_aba as 'ABA'," +
                " wires.account_holder as 'Account Holder', " +
                " wires.account_number as 'Account Number'," +
                " wires.confirmation as 'Confirmation', " +
                " wires.notes as 'Notes', " +
                " wires.raw_data as 'Raw Data'" +
                " FROM wires LEFT JOIN accounts faccounts ON wires.account_id = faccounts.id LEFT JOIN companies fcompanies ON faccounts.company_id = fcompanies.id LEFT JOIN bank_routes ON wires.bank_route_id = bank_routes.id " +
                " WHERE wires.status = 2 " +
                " AND wires.updated_at >= '" + req.params.period_from + " 00:00:00' AND wires.updated_at <= '" + req.params.period_to + " 23:59:59'";

            if( req.params.company_id ){
                query += " AND wires.company_id = '" + req.params.company_id + "'";

            }

            query += " ORDER BY wires.updated_at ASC";

            db.sequelize.query( query ).done( function( err, results ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else{
                        if( req.params.file_type === 'csv' ){
                            json2csv( {
                                data: results,
                                fields: [ 'Date', 'ID', 'Type', 'Method', 'Bank Route', 'Company', 'Currency', 'Amount', 'Fee Amount', 'Bank Name', 'Country', 'Swift', 'ABA', 'Account Holder', 'Account Number', 'Confirmation', 'Notes', 'Raw Data' ]
                            }, function( err, csv ){
                                if( !!err ){
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else{
                                    if( req.params.file_type === 'csv' ){
                                        res.setHeader( 'Content-disposition', 'attachment; filename=' + 'wires.csv' );
                                        res.setHeader( 'Content-type', 'text/csv' );
                                        res.send( 200, csv );
                                        return next();
                                    }
                                    else{
                                        res.send( 400, { errors: [ 'Unsupported file format' ] } );
                                        logger.error( 'account', '[' + req.params.file_type + '] is an unsupported file type',
                                            {
                                                req: req
                                            } );
                                        return next();
                                    }
                                }
                            } );
                        }
                        else{
                            res.send( 400, { errors: [ 'Unsupported file format' ] } );
                            logger.error( 'account', '[' + req.params.file_type + '] is an unsupported file type',
                                {
                                    req: req
                                } );
                            return next();
                        }
                    }
                }
            )
        }
        else{
            res.send( 400, { errors: [ 'Need to specify date range.' ] } );
            return next();
        }
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};


exports.qHoldWire = function( queueName, msg ){
    return Wire.update( { status: 4 }, { id: msg.id } ).then( function( rowsAffected ){
        if( rowsAffected === 1 ){
            akxLogger.info( 'Putting wire on hold: ' + msg.id );
        }
        else{
            akxLogger.error( new Error( 'An error occurred when Updating wire no rows were affected' ), null, null,
                { queueName: queueName, msg: msg }
            );
        }
    } ).catch( function( err ){
        akxLogger.error( err, null, null, { queueName: queueName, msg: msg } );
    } );
};



exports.qReleaseWire = function( queueName, msg ){
    return Wire.update( { status: 0 }, { id: msg.id } ).then( function( rowsAffected ){
        if( rowsAffected === 1 ){
            akxLogger.info( 'wire Released to be processed: ' + msg.id );
        }
        else{
            akxLogger.error( new Error( 'An error occurred when Updating wire no rows were affected' ), null, null,
                { queueName: queueName, msg: msg }
            );
        }
    } ).catch( function( err ){
        akxLogger.error( err, null, null, { queueName: queueName, msg: msg } );
    } );
};



exports.qMatchFirstWires = function( queueName, msg ){
    return Wire.count( {
        where: {
            company_id: msg.company_id,
            type: 0,
            status: 2
        }
    } ).then( function( count ){
        if( count <= 5 ){
            akxLogger.info( 'First wires detected for company: ' + msg.company_id );
            return UberException.create( {
                model: 'wire',
                model_id: msg.id,
                raw_data: JSON.stringify( { "reason": "First wires detected for company [" + msg.company_id + "]" } )
            } ).then( function( newException ){
                akxLogger.info( akxStrings.created( 'uber-exception', newException.id ), null,
                    [
                        { model: 'uber-exception', model_id: newException.id }
                    ],
                    { queueName: queueName, msg: msg }
                );
                return true;
            } );
        }
        else{
            akxLogger.info( 'not first wire out ' + msg.id );
            return false;
        }
    } ).catch( function( err ){
        akxLogger.error( err, null, null, { queueName: queueName, msg: msg } );
    } );
};




exports.qMatchInactiveCompanyTransactions = function( queueName, msg ){
    return Account.findAll( {
        where: {
            company_id: msg.company_id
        }
    } ).then( function( accounts ){
        var promises = [];
        _.forEach( accounts, function( account ){
            promises.push( _this.inactiveCompanyTransactions( account.id ) );
        } );
        return Promise.all( promises );
    } ).then( function( transCounts ){
        var transNotFound = _.every( transCounts, function( accountTransCount ){
            return accountTransCount === 0;
        } );

        //Check if there are transactions within recent 6 months but not include today.

        if( transNotFound ){
            akxLogger.info( "Company has been dormant for more than 6 months: " + msg.company_id );
            return UberException.create( {
                model: 'wire',
                model_id: msg.id,
                raw_data: JSON.stringify( { "reason": "Company has been dormant for more than 6 months" } )
            } ).then( function( newException ){
                akxLogger.info( akxStrings.created( 'uber-exception', newException.id ), null,
                    [
                        { model: 'uber-exception', model_id: newException.id }
                    ],
                    { queueName: queueName, msg: msg }
                );
                return true;
            } );
        }
        else{
            return false;
        }
    } ).catch( function( err ){
        akxLogger.error( err, null, null, { queueName: queueName, msg: msg } );
    } );
};


exports.inactiveCompanyTransactions = function( account_id ){
    return new Promise( function( resolve, reject ){
        return Transaction.count(
            {
                where: [
                    {
                        updated_at: {
                            gte: moment().subtract( 6, 'months' ).format( 'YYYY-MM-DD' )
                        }
                    },
                    { status: 1 },
                    Sequelize.or( { from_account_id: account_id }, { to_account_id: account_id } )
                ]
            }
        ).then( function( recentTransactionCount ){
            resolve( recentTransactionCount );
        } );
    } );

};

exports.qMatchFirstTimeBeneficiary = function( queueName, msg ){
    return Wire.count( {
        where: {
            account_holder: msg.account_holder,
            type: 0,
            status: 2
        }
    } ).then( function( count ){
        if( count < 2 ){
            akxLogger.info( 'First time beneficiary detected for company: ' + msg.company_id );
            return UberException.create( {
                model: 'wire',
                model_id: msg.id,
                raw_data: JSON.stringify( {
                    reason: "First time beneficiary: " +
                        msg.account_holder + " " +
                        msg.account_holder_country + " " +
                        msg.account_holder_dob
                } )
            } ).then( function( newException ){
                akxLogger.info( akxStrings.created( 'uber-exception', newException.id ), null,
                    [
                        { model: 'uber-exception', model_id: newException.id }
                    ],
                    { queueName: queueName, msg: msg }
                );
                return true;
            } );
        }
        else{
            akxLogger.info( 'Not first time beneficiary ' + msg.id );
            return false;
        }
    } ).catch( function( err ){
        akxLogger.error( err, null, null, { queueName: queueName, msg: msg } );
    } );
};
