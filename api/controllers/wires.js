




var Sequelize = require( 'sequelize' );
var math = require( 'mathjs' );
var Hashids = require( "hashids" );
var db = require( '../models' );
var request = require( 'request' );
var moment = require( 'moment-timezone' );
var Promise = require( 'promise' );
var brnv = require( 'bank-routing-number-validator' );
var ibantools = require( 'ibantools' );

var Account = db.Account;
var Wire = db.Wire;
var Transaction = db.Transaction;
var Currency = db.Currency;
var Company = db.Company;
var Lead = db.Lead;
var WireInstruction = db.WireInstruction;
var AccountAlias = db.AccountAlias;
var CompanyWireInstruction = db.CompanyWireInstruction;
var BankRoute = db.BankRoute;

var wire_instructions = require( './wire_instructions' );

var notifier = require( '../lib/akx.notifier.js' );
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var pdfConfig = require( '../config/config.json' ).pdf_api;
var hashidConfig = require( '../config/config.json' ).secrets.hashId;
var msgConfig = require( '../config/config.json' ).msg_api;
var _this = this;
var _ = require( 'lodash' );
var hashids = new Hashids( hashidConfig, 11, "LP4D7XBFO8A2NZYK5EUIR6MVH3WQJGS10TC9" );
var transports = require( '../config/config.json' ).akxLogger.transports;
var util = require( '../lib/akx.util.js' );
var currentFileName = __filename.split( '/' ).pop();
var akxLogger = require( 'logger' )( currentFileName, transports );



exports.handleError = function( err, req, res ){
    util.handleError( 'wire', err, req, res );
};





exports.index = function( req, res, next ){

    if( _.isString( req.params.q ) || ( req.params.fromDate ) || ( req.params.toDate ) ){
        return _this.search( req, res, next );
    }
    else{
        return _this.findByCompany( req, res, next );
    }
};



exports.findByCompany = function( req, res, next ){

    var wiresOptions = {
        where: [
            { company_id: req.user.company_id },
            { status: [ 0, 1, 2, 4, 5, 9 ] }
        ],
        order: [
            [ 'created_at', 'DESC' ]
        ]
    };

    // Find if the supplied account_id, from_account_id or to_account_id is owned by the requesting company
    req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
    req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );

    var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
    if( paged ){
        wiresOptions.offset = ( req.params.page - 1 ) * req.params.per_page;
        wiresOptions.limit = req.params.per_page;
    }

    Wire.findAndCountAll( wiresOptions ).done( function( err, wires ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else{
            var totalPages = 1;
            if( paged ){
                var count = wires.count;
                var rem = count % req.params.per_page;
                totalPages = Math.floor( count / req.params.per_page );

                if( rem > 0 ){
                    totalPages++;
                }
            }

            res.send( 200, { wires: wires.rows, meta: { total_pages: totalPages } } );
            return next();
        }
    } );
};




exports.search = function( req, res, next ){

    var query = [];

    var wireOptions = {
        where: [
            { company_id: req.user.company_id },
            { status: [ 0, 1, 2, 4, 5, 9 ] }
        ],
        order: [
            [ 'created_at', 'DESC' ]
        ]
    };

    if( _.isString( req.params.q ) && !_.isEmpty( req.params.q ) ){
        query.push(
            { name: { like: '%' + req.params.q + '%' } },
            { account_holder: { like: '%' + req.params.q + '%' } }
        );
    }
    if( !_.isEmpty( req.params.fromDate ) ){
        wireOptions.where.push( {
            created_at: {
                gte: moment( req.params.fromDate ).format( 'YYYY-MM-DD 00:00:00' )
            }
        } );
    }
    if( !_.isEmpty( req.params.toDate ) ){
        wireOptions.where.push( {
            created_at: {
                lte: moment( req.params.toDate ).format( 'YYYY-MM-DD 23:59:59' )
            }
        } );
    }

    if( query.length > 0 ){
        wireOptions.where.push( db.Sequelize.or.apply( this, query ) );
    }

    // Find if the supplied account_id, from_account_id or to_account_id is owned by the requesting company
    req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
    req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );

    var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
    if( paged ){
        wireOptions.offset = ( req.params.page - 1 ) * req.params.per_page;
        wireOptions.limit = req.params.per_page;
    }

    Wire.findAndCountAll( wireOptions ).done( function( err, wires ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else{
            var totalPages = 1;
            if( paged ){
                var count = wires.count;
                var rem = count % req.params.per_page;
                totalPages = Math.floor( count / req.params.per_page );

                if( rem > 0 ){
                    totalPages++;
                }
            }

            res.send( 200, { wires: wires.rows, meta: { total_pages: totalPages } } );
            return next();
        }
    } )
};





exports.sendInstructions = function( req, res, next ){

    req.assert( 'data', 'isObject' );
    req.assert( 'data.name', 'isString' );
    req.assert( 'data.email', 'isString' );

    if( !_.isEmpty( req.validationErrors ) ){
        util.handleValidationErrors( req, res );
        return next();
    }

    else{
        var company;

        Company.find( {
            where: [
                { id: req.user.company_id }
            ]
        } ).then( function( theCompany ){
            company = theCompany;
            return Promise.all( [
                CompanyWireInstruction.findAll( {
                    where: {
                        company_id: req.user.company_id
                    }
                } ),
                AccountAlias.findAll( {
                    where: {
                        company_id: req.user.company_id
                    },
                    include: {
                        model: Company
                    }
                } )
            ] );
        } ).then( function( results ){
            var comWireIns = results.shift();
            var accountAliases = results.shift();
            var instructionIds = [];
            _.forEach( comWireIns, function( comIns ){
                instructionIds.push( comIns.wire_instruction_id );
            } );
            return {
                instructionIds: instructionIds,
                accountAliases: accountAliases
            };
        } ).then( function( results ){
            return wire_instructions.mapPreferredInstructions( results.accountAliases, [] ).then( function( preferredWireInstructions ){
                if( results.instructionIds.length === 0 ){
                    return {
                        standardWireInstructions: [],
                        preferredWireInstructions: preferredWireInstructions
                    };
                }
                else{
                    return WireInstruction.findAll( {
                        where: {
                            id: results.instructionIds
                        },
                        include: {
                            model: Currency
                        }
                    } ).then( function( standardWireInstructions ){
                        return {
                            standardWireInstructions: standardWireInstructions,
                            preferredWireInstructions: preferredWireInstructions
                        };
                    } );
                }
            } );
        } ).then( function( results ){
            for( var i = 0; i < results.standardWireInstructions.length; i++ ){
                results.standardWireInstructions[ i ].method_ach = results.standardWireInstructions[ i ].method_ach ? 'Yes' : 'No';
                results.standardWireInstructions[ i ].method_wire = results.standardWireInstructions[ i ].method_wire ? 'Yes' : 'No';
            }
            for( var i = 0; i < results.preferredWireInstructions.length; i++ ){
                results.preferredWireInstructions[ i ].method_ach = results.preferredWireInstructions[ i ].method_ach ? 'Yes' : 'No';
                results.preferredWireInstructions[ i ].method_wire = results.preferredWireInstructions[ i ].method_wire ? 'Yes' : 'No';
            }

            notifier.sendEmail( 'akx-wire-instructions', req.body.data.email, req.body.data.name, {
                name: req.body.data.name,
                from_name: req.user.name,
                from_email: req.user.email,
                from_company: company.name,
                account_number: company.account_number,
                standard_wire_instructions: results.standardWireInstructions,
                preferred_wire_instructions: results.preferredWireInstructions
            }, req );

            var newLead = Lead.build( {
                user_id: req.user.id,
                name: req.body.data.name,
                company_name: req.body.data.company_name,
                email: req.body.data.email
            } );
            return newLead.save();
        } ).then( function(){
            res.send( 200, { status: 'ok' } );
            return next();
        } ).catch( function( err ){
            return util.handleLibError( err, req, res, akxLogger );
        } );
    }
};






exports.view = function( req, res, next ){

    req.assert( 'wire_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Wire.find( {
            where: [
                { id: req.params.wire_id },
                { status: [ 0, 1, 2, 4, 5, 9 ] }
                //{ company_id: req.user.company_id }
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
                // Internal
                if( wire.values.type === 2 || wire.values.company_id === req.user.company_id ){
                    res.send( 200, { wire: wire } );
                    return next();
                }
                else{
                    res.send( 404 );
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





exports.create = function( req, res, next ){

    req.assert( 'wire', 'isObject' );
    req.assert( 'wire.type', 'isNumber' );

    if( _.isEmpty( req.validationErrors ) ){
        switch( req.body.wire.type ){
            case 0:
                exports.wireout( req, res, next );
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





exports.wirein = function( req, res, next ){


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
                    if( account.company_id != req.user.company_id ){
                        res.send( 403 );
                        logger.error( 'security', 'company_id in request does not match the token company_id', {
                            req: req
                        } );
                        return next();
                    }
                    else{

                        var newWire = Wire.build( req.body.wire );
                        newWire.currency_id = account.currency_id;
                        newWire.company_id = account.company_id;
                        newWire.name = hashids.encode( new Date().getTime() );
                        newWire.status = 0;
                        newWire.speedwire = 0;
                        newWire.method = 0;
                        newWire.confirmation = null;

                        newWire.fee = req.user.fee.getWireFee( newWire );

                        newWire.save().done( function( err ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else{
                                res.send( 201, { wire: newWire } );

                                notifier.notifyCompany( 'akx-wire-in', req.user.company_id, { wire_name: 'W-' + newWire.name, account_holder: newWire.account_holder }, req );

                                // Log
                                Company.find( req.user.company_id ).done( function( err, company ){
                                    if( err || _.isEmpty( company ) ){
                                        logger.metaLog( 'wire', 'Cannot find from company information', {
                                            req: req
                                        } );

                                        logger.info( 'wire', 'wirein W-' + newWire.name + '[' + newWire.id + '] created by [' + req.user.company_id + ']', {
                                            req: req,
                                            model: 'wire',
                                            model_id: newWire.id
                                        } );
                                    }
                                    else{
                                        logger.info( 'wire', 'wirein W-' + newWire.name + '[' + newWire.id + '] created by ' + company.name + ' [' + req.user.company_id + ']', {
                                            req: req,
                                            model: 'wire',
                                            model_id: newWire.id
                                        } );
                                    }
                                    return next();
                                } );
                            }
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




exports.wireout = function( req, res, next ){
    req.assert( 'wire', 'isObject' );
    req.assert( 'wire.account_id', 'isString' );
    req.assert( 'wire.amount', 'isNumber' );
    req.assert( 'wire.method', 'isNumber' );
    req.assert( 'wire.type', 'isNumber' );
    req.assert( 'wire.speedwire', 'isNumber' );

    if( _.isEmpty( req.validationErrors ) ){

        req.body.wire.amount = Number( req.body.wire.amount );

        _this.wireValidations( req.body.wire )
            .then( function( wire ){
                Account.find( {
                    where: [
                        { id: req.body.wire.account_id },
                        { company_id: req.user.company_id },
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

                            if( account.company.dual_custody === 1 ){
                                newWire.first_user_id = req.user.id;
                                newWire.status = 4;
                            }
                            else{
                                newWire.status = 9;
                            }


                            newWire.fee = req.user.fee.getWireFee( newWire );

                            if( account.balance < newWire.amount + newWire.fee ){
                                res.send( 400, { errors: [ 'Insufficient fund' ] } );
                                logger.error( 'wire', 'insufficient fund', {
                                    req: req
                                } );

                                return next();
                            }
                            else{
                                // Take money from Account
                                account.balance -= newWire.amount;
                                account.balance -= newWire.fee;
                                account.save().done( function( err ){
                                    if( !!err ){
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else{

                                        // save new wire
                                        newWire.save().done( function( err ){
                                            if( !!err ){
                                                _this.handleError( err, req, res );
                                                return next();
                                            }
                                            else{
                                                // get currency for fee_account_id
                                                Currency.find( account.currency_id ).done( function( err, currency ){
                                                    if( !!err ){
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
                                                        chainer.add( wireTransaction.save() );

                                                        if( newWire.fee != 0 ){
                                                            var feeTransaction = Transaction.build( {
                                                                parent_id: wireTransaction.id,
                                                                currency_id: account.currency_id,
                                                                from_account_id: account.id,
                                                                to_account_id: currency.fee_wire_account_id,
                                                                model: 'wire',
                                                                model_id: newWire.id,
                                                                amount: newWire.fee,
                                                                type: 3,
                                                                status: 0
                                                            } );

                                                            chainer.add( feeTransaction.save() );
                                                        }

                                                        chainer.runSerially().done( function( err ){
                                                            if( !!err ){
                                                                _this.handleError( err, req, res );
                                                                return next();
                                                            }
                                                            else{
                                                                res.send( 201, { wire: newWire } );

                                                                notifier.notifyCompany( 'akx-wire-out', req.user.company_id, { wire_name: 'W-' + newWire.name, account_holder: newWire.account_holder }, req );
                                                                logger.info( 'wire', 'wireout W-' + newWire.name + '[' + newWire.id + ']', {
                                                                    req: req,
                                                                    model: 'wire',
                                                                    model_id: newWire.id
                                                                } );

                                                                var emailVars = {
                                                                    wire: {
                                                                        type: 'Wire Out',
                                                                        name: newWire.name,
                                                                        amount: newWire.amount,
                                                                        bank_country: newWire.bank_country,
                                                                        bank_name: newWire.bank_name,
                                                                        bank_address: newWire.bank_address,
                                                                        bank_city: newWire.bank_city,
                                                                        bank_state_province: newWire.bank_state_province,
                                                                        bank_phone: newWire.bank_phone,
                                                                        bank_postal_code: newWire.bank_postal_code,
                                                                        code_swift: newWire.code_swift,
                                                                        code_aba: newWire.code_aba,
                                                                        account_holder: newWire.account_holder,
                                                                        account_number: newWire.account_number,
                                                                        account_holder_dob: newWire.account_holder_dob,
                                                                        account_holder_address: newWire.account_holder_address,
                                                                        account_holder_city: newWire.account_holder_city,
                                                                        account_holder_state_province: newWire.account_holder_state_province,
                                                                        account_holder_postal_code: newWire.account_holder_postal_code,
                                                                        account_holder_country: newWire.account_holder_country,
                                                                        account_iban: newWire.account_iban,
                                                                        notes: newWire.notes,
                                                                        notes_akirix: newWire.notes_akirix,
                                                                        purpose: newWire.purpose
                                                                    },
                                                                    currency: { symbol: currency.symbol },
                                                                    company: { name: account.company.name, account_number: account.company.account_number },
                                                                    user: { name: req.user.name, email: req.user.email }
                                                                };

                                                                if( newWire.speedwire !== undefined && newWire.speedwire !== null && newWire.speedwire !== 0 && newWire.speedwire !== false ){
                                                                    emailVars.wire.type = 'Speedwire Out';
                                                                }
                                                                else if( req.body.wire.method === 1 ){
                                                                    emailVars.wire.type = 'Wire Out (ACH)';
                                                                }
                                                                return next();
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
            } )
            .catch( function( err ){
                res.send( 400, { errors: err } );
                return next();
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};


exports.wireValidations = function( wire ){
    return new Promise( function( resolve, reject ){
        var errors = [];
        var validations = [
            { key: 'account_id', validation: _.isString, msg: 'Must be string' },
            { key: 'beneficiary_type', validation: _.isNumber, msg: 'Must be number' },
            { key: 'account_holder', validation: _.isString, msg: 'Must be string' },
            { key: 'account_holder_country', validation: _.isString, msg: 'Must be string' },
            { key: 'account_holder_address', validation: _.isString, msg: 'Must be string' },
            { key: 'account_holder_city', validation: _.isString, msg: 'Must be string' },
            { key: 'account_number', validation: _.isString, msg: 'Must be string' },
            { key: 'bank_name', validation: _.isString, msg: 'Must be string' },
            { key: 'bank_country', validation: _.isString, msg: 'Must be string' },
            { key: 'bank_address', validation: _.isString, msg: 'Must be string' },
            { key: 'bank_postal_code', validation: _.isString, msg: 'Must be string' },
            { key: 'bank_city', validation: _.isString, msg: 'Must be string' },
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
        
        if( wire.bank_country === 'US' ){
            validations.push( { key: 'bank_state_province', validation: _.isString, msg: 'Must be string' } );
        }

        if( !_.isEmpty( wire.intermediary_bank_name ) || !_.isEmpty( wire.intermediary_bank_code_aba ) || !_.isEmpty( wire.intermediary_bank_code_swift ) || !_.isEmpty( wire.intermediary_bank_country ) ){
            if( wire.type === 0 && wire.currency_id === 'USD' && wire.method === 0 ){
                validations.push(
                    { key: 'intermediary_bank_name', validation: _.isString, msg: 'Must be string' },
                    { key: 'intermediary_bank_country', validation: _.isString, msg: 'Must be string' }
                );

                if( wire.intermediary_bank_country === 'US' ){
                    if( !wire.intermediary_bank_code_aba && !wire.intermediary_bank_code_swift ){
                        errors.push( { msg: 'Intermediary Bank ABA/Routing number or SWIFT code is required' } );
                    }
                }
                else{
                    if( !wire.intermediary_bank_code_swift ){
                        errors.push( { msg: 'Intermediary Bank SWIFT code is required' } );

                    }
                }

                if( wire.intermediary_bank_code_aba ){
                    if( !brnv.ABARoutingNumberIsValid( wire.intermediary_bank_code_aba ) || wire.intermediary_bank_code_aba.length !== 9 ){
                        errors.push( 'Invalid Intermediary ABA/Routing number' );
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
                if( !_.isEmpty( wire.intermediary_bank_postal_code ) ){
                    validations.push(
                        { key: 'intermediary_bank_postal_code', validation: _.isString, msg: 'Must be string' }
                    )
                }
            }
        }
        _.forEach( validations, function( value, key ){
            if( wire.hasOwnProperty( value.key ) ){
                if( !value[ 'validation' ]( wire[ value.key ] ) ){
                    var errorObj = {};
                    errorObj[ value.key ] = value.msg;
                    errors.push( errorObj );
                }
            }
            else{
                errors.push( value.msg );
            }
        } );

        // Check code_aba
        if( wire.code_aba ){
            if( !brnv.ABARoutingNumberIsValid( wire.code_aba ) || wire.code_aba.length !== 9 ){
                errors.push( 'Invalid ABA/Routing number' );
            }
        }
        // Error checking for WIRE validations
        if( wire.method === 0 ){
            if( wire.amount <= 0 ){
                errors.push( { amount: 'invalid amount' } );
            }
            if( wire.bank_country === 'US' ){
                if( !wire.code_aba && !wire.code_swift ){
                    errors.push( 'either ABA/Routing number or SWIFT code is required' );
                }
            }
            else{
                if( !wire.code_swift ){
                    errors.push( { code_swift: 'SWIFT code is required' } );
                }
                if( wire.code_swift && !ibantools.isValidBIC( wire.code_swift ) ){
                    errors.push( 'Invalid SWIFT code' );
                }
                //if( !wire.account_iban && wire.currency_id !== 'USD' ){
                //    errors.push( { account_iban: 'IBAN is required' } );
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

        if( _.isEmpty( errors ) ){
            resolve();
        }
        else{
            reject( errors );
        }
    } );
};



exports.bookTransfer = function( req, res, next ){

    req.assert( 'wire', 'isObject' );
    req.assert( 'wire.account_id', 'isString' );
    req.assert( 'wire.account_number', 'isString' );
    req.assert( 'wire.amount', 'isNumber' );
    req.assert( 'wire.method', 'isNumber' );
    req.assert( 'wire.type', 'isNumber' );

    if( _.isEmpty( req.validationErrors ) ){

        req.body.wire.amount = Number( req.body.wire.amount );
        // Find the from Account
        Account.find( {
            where: [
                { id: req.body.wire.account_id },
                { type: 0 }
            ],
            include: [
                {
                    model: Company,
                    status: [ 1, 2 ]
                }
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
                else if( account.company_id != req.user.company_id ){
                    res.send( 403 );
                    logger.error( 'security', 'company_id in request does not match the token company_id', {
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
                    var fee = math.round( req.body.wire.amount * Number( req.user.fee.getBookTransferRate() ), 2 );
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
                            } else if( _.isEmpty( toCompany ) ){
                                res.send( 400, { errors: [ 'cannot find company for account XYZ-' + req.body.wire.account_number ] } );
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
                                        account.save().done( function( err ){
                                            if( !!err ){
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

                                                newWire.save().done( function( err ){
                                                    if( !!err ){
                                                        _this.handleError( err, req, res );
                                                        return next();
                                                    }
                                                    else{

                                                        Currency.find( account.currency_id ).done( function( err, currency ){
                                                            if( !!err ){
                                                                _this.handleError( err, req, res );
                                                                return next();
                                                            }
                                                            else if( _.isEmpty( currency ) ){
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

                                                                    toAccount.save().done( function( err ){
                                                                        if( !!err ){
                                                                            logger.error( 'wire', 'Failed to create account for company ' + toCompany.name + ' [' + toCompany.id + ']', {
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

                                                                            wireTransaction.save().done( function( err ){
                                                                                if( !!err ){
                                                                                    logger.error( 'wire', 'Failed to create transaction for W-' + newWire.name + ' [' + newWire.id + ']', { req: req } );
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
                                                                                    feeTransaction.save().done( function( err ){
                                                                                        if( !!err ){
                                                                                            logger.error( 'wire', 'Failed to create fee transaction for W-' + newWire.name + ' [' + newWire.id + ']', { req: req } );
                                                                                        }
                                                                                        else{
                                                                                            res.send( 201, { wire: newWire } );

                                                                                            notifier.notifyCompany( 'akx-wire-book-transfer-sent', req.user.company_id, { wire_name: 'W-' + newWire.name, account_holder: newWire.account_holder, to_company_name: toCompany.name + ' (XYZ' + toCompany.account_number + ')' }, req );
                                                                                            notifier.notifyCompany( 'akx-wire-book-transfer-received', toCompany.id, { wire_name: 'W-' + newWire.name, account_holder: newWire.account_holder, from_company_name: account.company.name + ' (XYZ' + account.company.account_number + ')' }, req );

                                                                                            logger.info( 'wire', 'internal-transfer W-' + newWire.name + '[' + newWire.id + ']', {
                                                                                                req: req,
                                                                                                model: 'wire',
                                                                                                model_id: newWire.id
                                                                                            } );

                                                                                            return next();
                                                                                        }
                                                                                    } );
                                                                                }
                                                                                else{
                                                                                    res.send( 201, { wire: newWire } );

                                                                                    notifier.notifyCompany( 'akx-wire-book-transfer-sent', req.user.company_id, { wire_name: 'W-' + newWire.name, account_holder: newWire.account_holder, to_company_name: toCompany.name + ' (XYZ' + toCompany.account_number + ')' }, req );
                                                                                    notifier.notifyCompany( 'akx-wire-book-transfer-received', toCompany.id, { wire_name: 'W-' + newWire.name, account_holder: newWire.account_holder, from_company_name: account.company.name + ' (XYZ' + account.company.account_number + ')' }, req );

                                                                                    logger.info( 'wire', 'internal-transfer W-' + newWire.name + '[' + newWire.id + ']', {
                                                                                        req: req,
                                                                                        model: 'wire',
                                                                                        model_id: newWire.id
                                                                                    } );

                                                                                    return next();
                                                                                }
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

                                                                    wireTransaction.save().done( function( err ){
                                                                        if( !!err ){
                                                                            logger.error( 'wire', 'Failed to create transaction for W-' + newWire.name + ' [' + newWire.id + ']', { req: req } );
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
                                                                            feeTransaction.save().done( function( err ){
                                                                                if( !!err ){
                                                                                    logger.error( 'wire', 'Failed to create fee transaction for W-' + newWire.name + ' [' + newWire.id + ']', { req: req } );
                                                                                }
                                                                                else{
                                                                                    res.send( 201, { wire: newWire } );

                                                                                    notifier.notifyCompany( 'akx-wire-book-transfer-sent', req.user.company_id, { wire_name: 'W-' + newWire.name, account_holder: newWire.account_holder, to_company_name: toCompany.name + ' (XYZ' + toCompany.account_number + ')' }, req );
                                                                                    notifier.notifyCompany( 'akx-wire-book-transfer-received', toCompany.id, { wire_name: 'W-' + newWire.name, account_holder: newWire.account_holder, from_company_name: account.company.name + ' (XYZ' + account.company.account_number + ')' }, req );

                                                                                    logger.info( 'wire', 'internal-transfer W-' + newWire.name + '[' + newWire.id + ']', {
                                                                                        req: req,
                                                                                        model: 'wire',
                                                                                        model_id: newWire.id
                                                                                    } );

                                                                                    return next();
                                                                                }
                                                                            } );
                                                                        }
                                                                        else{
                                                                            res.send( 201, { wire: newWire } );

                                                                            notifier.notifyCompany( 'akx-wire-book-transfer-sent', req.user.company_id, { wire_name: 'W-' + newWire.name, account_holder: newWire.account_holder, to_company_name: toCompany.name + ' (XYZ' + toCompany.account_number + ')' }, req );
                                                                            notifier.notifyCompany( 'akx-wire-book-transfer-received', toCompany.id, { wire_name: 'W-' + newWire.name, account_holder: newWire.account_holder, from_company_name: account.company.name + ' (XYZ' + account.company.account_number + ')' }, req );

                                                                            logger.info( 'wire', 'internal-transfer W-' + newWire.name + '[' + newWire.id + ']', {
                                                                                req: req,
                                                                                model: 'wire',
                                                                                model_id: newWire.id
                                                                            } );

                                                                            return next();
                                                                        }
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
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};






exports.approve = function( req, res, next ){
    Wire.find( {
        where: [
            { id: req.params.wire_id },
            { company_id: req.user.company_id }
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
            if( wire.first_user_id !== req.user.id && wire.status === 4 ){
                wire.status = 0;
                wire.second_user_id = req.user.id;
                wire.save().done( function( err, wire ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else{
                        logger.info( 'wire', 'approved W-' + wire.name + '[' + wire.id + ']', {
                            req: req,
                            model: 'wire',
                            model_id: wire.id
                        } );
                        res.send( 200, { wire: wire } );
                        return next();
                    }
                } );
            }
            else{
                res.send( 403 );
                return next();
            }
        }
    } );
};





exports.cancel = function( req, res, next ){

    req.assert( 'wire_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        Wire.find( {
            where: [
                { id: req.params.wire_id },
                { company_id: req.user.company_id }
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
                if( wire.status === 0 || wire.status === 9 ){

                    // Wire Out
                    if( wire.type === 0 ){

                        wire.status = 3;

                        wire.save().done( function( err, wire ){
                            if( !!err ){
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
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else{
                                        var transactions = results[ 0 ];
                                        var fromAccount = results[ 1 ];

                                        _.forEach( transactions, function( trans ){
                                            fromAccount.balance += trans.amount;
                                            trans.status = 2;
                                            trans.save().done( function( err ){
                                                if( !!err ){
                                                    logger.error( 'wire', 'failed status update to transaction [' + trans.id + ']', {
                                                        req: req
                                                    } );
                                                }
                                            } );
                                        } );

                                        fromAccount.save().done( function( err ){
                                            if( !!err ){
                                                _this.handleError( err, req, res );
                                                return next();
                                            }
                                            else{
                                                notifier.notifyCompany( 'akx-wire-cancel', req.user.company_id, { wire_name: 'W-' + wire.name }, req );
                                                logger.info( 'wire', 'cancelled W-' + wire.name + '[' + wire.id + ']', {
                                                    req: req,
                                                    model: 'wire',
                                                    model_id: wire.id
                                                } );

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
                        wire.save().done( function( err, wire ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else{
                                notifier.notifyCompany( 'akx-wire-cancel', req.user.company_id, { wire_name: 'W-' + wire.name }, req );
                                logger.info( 'wire', 'cancelled W-' + wire.name + '[' + wire.id + ']', {
                                    req: req,
                                    model: 'wire',
                                    model_id: wire.id
                                } );
                                res.send( 200, { wire: wire } );
                                return next();
                            }
                        } );
                    }
                    // Internal
                    else{
                        res.send( 403 );
                        return next();
                    }
                }
                else{
                    res.send( 400, { errors: [ 'Request status does not allow this action.' ] } );
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





exports.getPdf = function( req, res, next ){
    req.assert( 'wire_id', 'isString' );

    if( !_.isEmpty( req.validationErrors ) ){
        util.handleValidationErrors( req, res );
        return next();
    }
    else{
        Wire.find( {
            where: {
                id: req.params.wire_id,
                company_id: req.user.company_id
            },
            include: [
                { model: BankRoute },
                {
                    model: Company,
                    attributes: [ 'id', 'name', 'account_number', 'address', 'city', 'state_province', 'postal_code', 'phone', 'email' ]
                }
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
