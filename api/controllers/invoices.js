var Sequelize = require( 'sequelize' );
var Globalize = require( 'globalize' );
var moment = require( 'moment-timezone' );
var db = require( '../models' );
var math = require( 'mathjs' );
var request = require( 'request' );
var _ = require( 'lodash' );
var Hashids = require( "hashids" );

var Account = db.Account;
var Node = db.Node;
var Fund = db.Fund;
var Project = db.Project;
var NodeItem = db.NodeItem;
var Invoice = db.Invoice;
var Company = db.Company;
var InvoiceItem = db.InvoiceItem;
var Transaction = db.Transaction;
var Currency = db.Currency;
var Fee = db.Fee;

var pdfConfig = require( '../config/config.json' ).pdf_api;
var hashidConfig = require( '../config/config.json' ).secrets.hashId;
var notifier = require( '../lib/akx.notifier.js' );
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;
var invoiceNameHasher = new Hashids( hashidConfig, 5, "BQO258NH06VMRS1LX4J7WYKC3DIFTZUAG9EP" );



exports.handleError = function( err, req, res ){
    util.handleError( 'invoice', err, req, res );
};





exports.index = function( req, res, next ){
    var invoiceConds = {};

    // Find bills
    if( req.params.hasOwnProperty( 'to_company_id' ) ){
        invoiceConds = {
            where: [
                { to_company_id: req.user.company_id },
                { status: [ 1, 2, 3 ] }
            ],
            order: [
                [ 'created_at', 'DESC' ]
            ]
        };
    }
    else if( req.params.hasOwnProperty( 'node_id' ) ){
        invoiceConds = {
            where: [
                { node_id: req.params.node_id },
                { status: [ 0, 1, 2, 3 ] }
            ],
            order: [
                [ 'created_at', 'DESC' ]
            ]
        };
    }
    // Specific Invoices
    else if( req.params.hasOwnProperty( 'ids' ) ){
        invoiceConds = {
            where: {
                id: req.params.ids
            },
            order: [
                [ 'created_at', 'DESC' ]
            ]
        };

        req.assert( 'ids', 'isArray' );
    }
    else{
        invoiceConds = {
            where: [
                { company_id: req.user.company_id },
                { status: [ 0, 1, 2, 3 ] }
            ],
            order: [
                [ 'created_at', 'DESC' ]
            ]
        };
    }

    if( _.isEmpty( req.validationErrors ) ){
        // Find if the supplied account_id, from_account_id or to_account_id is owned by the requesting company
        req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
        req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );

        var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
        if( paged ){
            invoiceConds.offset = ( req.params.page - 1 ) * req.params.per_page;
            invoiceConds.limit = req.params.per_page;
        }

        invoiceConds[ 'include' ] = [
            {
                model: Node,
                include: [
                    {
                        model: Node,
                        as: 'bnode'
                    }
                ]
            }
        ];

        Invoice.findAndCountAll( invoiceConds ).done( function( err, invoices ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !invoices ){
                res.send( 200, { invoices: [] } );
                return next();
            }
            else{
                var totalPages = 1;
                if( paged ){
                    var count = invoices.count;
                    var rem = count % req.params.per_page;
                    totalPages = Math.floor( count / req.params.per_page );

                    if( rem > 0 ){
                        totalPages++;
                    }
                }

                var validInvoices = [];
                for( var i = 0; i < invoices.rows.length; i++ ){
                    if( invoices.rows[ i ].company_id === req.user.company_id || invoices.rows[ i ].to_company_id === req.user.company_id ){
                        validInvoices.push( invoices.rows[ i ] );
                    }
                    else if( !_.isEmpty( invoices.rows[ i ].node ) && !_.isEmpty( invoices.rows[ i ].node.bnode ) ){
                        if( invoices.rows[ i ].node.bnode.company_id === req.user.company_id ){
                            validInvoices.push( invoices.rows[ i ] );
                        }
                    }
                }


                for( var i = 0; i < validInvoices.length; i++ ){
                    validInvoices[ i ].values.links = {
                        invoice_items: '/invoiceItems?invoice_id=' + validInvoices[ i ].id
                    };
                }

                res.send( 200, { invoices: validInvoices, meta: { total_pages: totalPages } } );
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

    req.assert( 'invoice_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        Invoice.find( {
            where: [
                { id: req.params.invoice_id }
            ],
            include: [
                {
                    model: Node,
                    include: {
                        model: Fund
                    }
                }
            ]
        } )
            .done( function( err, invoice ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !invoice ){
                    res.send( 404 );
                    return next();
                }
                else{
                    invoice.values.links = {
                        invoice_items: '/invoiceItems?invoice_id=' + invoice.id
                    };
                    if( invoice.company_id === req.user.company_id || invoice.to_company_id === req.user.company_id || ( !_.isEmpty( invoice.node ) && !_.isEmpty( invoice.node.fund ) && invoice.node.fund.investor_id === req.user.company_id ) ){
                        res.send( 200, { invoice: invoice } );
                        return next();
                    }
                    else if( invoice.status !== 0 ){
                        db.Node.find( {
                            where: {
                                id: invoice.node_id
                            },
                            include: [
                                {
                                    model: db.Node,
                                    as: 'bnode',
                                    include: {
                                        model: Fund
                                    }
                                }
                            ]
                        } ).done( function( err, node ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            // If the requester is also the receiver
                            else if( !_.isEmpty( node ) && !_.isEmpty( node.bnode ) && ( node.bnode.company_id === req.user.company_id || ( !_.isEmpty( node.bnode.fund ) && node.bnode.fund.investor_id === req.user.company_id ) ) ){
                                res.send( 200, { invoice: invoice } );
                                return next();
                            }
                            else{
                                res.send( 404 );
                                return next();
                            }
                        } );
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




exports.external = function( req, res, next ){

    req.assert( 'invoice_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        var hashids = new Hashids( hashidConfig, 10 );
        var invoiceOrder = hashids.decode( req.params.invoice_id );

        Invoice.find( {
            where: {
                order: invoiceOrder,
                type: 2 // External invoice only
            },
            include: [
                { model: Currency },
                { model: InvoiceItem },
                { model: Company }
            ]
        } )
            .done( function( err, invoice ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !invoice ){
                    res.send( 404 );
                    return next();
                }
                else{
                    var invoiceItems = [];
                    var invoiceItemIds = [];

                    for( var i = 0; i < invoice.invoiceItems.length; i++ ){
                        invoiceItems.push( invoice.invoiceItems[ i ] );
                        invoiceItemIds.push( invoice.invoiceItems[ i ].id );
                    }

                    invoice.values.invoice_items = invoiceItemIds;
                    invoice.values.currency = invoice.values.currency_id;
                    invoice.values.company = invoice.values.company_id;

                    res.send( 200, {
                        invoice: invoice,
                        invoiceItems: invoiceItems,
                        currency: invoice.currency,
                        company: invoice.company
                    } );
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
    req.assert( 'invoice', 'isObject' );
    req.assert( 'invoice.type', 'isNumber' );

    if( _.isEmpty( req.validationErrors ) ){
        if( req.body.invoice.to_company_id === req.user.company_id ){
            return res.send( 400, { errors: [ 'Cannot invoice yourself' ] } );
        }
        else if( req.body.invoice.type === 0 ){
            createProjectInvoice( req, res, next );
        }
        else if( req.body.invoice.type === 1 ){
            createPlatformInvoice( req, res, next );
        }
        else if( req.body.invoice.type === 2 ){
            createExternalInvoice( req, res, next );
        }
    }
    else{
        util.handleValidationErrors( req, res );
    }
};



function createPlatformInvoice( req, res, next ){
    req.assert( 'invoice', 'isObject' );
    req.assert( 'invoice.type', 'isNumber' );
    req.assert( 'invoice.account_number', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Account.find( {
            where: [
                { id: req.body.invoice.account_id },
                { company_id: req.user.company_id }
            ]
        } ).done( function( err, account ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( _.isEmpty( account ) ){
                res.send( 400, { errors: [ 'Cannot find given account' ] } );
                return next();
            }
            else{
                Company.find( {
                    where: [
                        { account_number: req.body.invoice.account_number }
                    ]
                } ).done( function( err, buyerCompany ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else if( _.isEmpty( buyerCompany ) ){
                        res.send( 400, { errors: [ 'Company can not be found for account XYZ' + req.body.invoice.account_number ] } );
                        return next();
                    }
                    else if( buyerCompany.id === req.user.company_id ){
                        res.send( 400, { errors: [ "Can't invoice self." ] } );
                        return next();
                    }
                    else{
                        var newInvoice = Invoice.build( {
                            invoice_date: moment.utc().format(),
                            invoice_period_from: null,
                            invoice_period_to: null,
                            title: req.body.invoice.title,
                            company_id: req.user.company_id,
                            to_company_id: buyerCompany.id,
                            node_id: null,
                            project_id: null,
                            account_id: account.id,
                            currency_id: account.currency_id,
                            notes: req.body.invoice.notes,
                            parent_id: null,
                            tax_rate: req.body.invoice.tax_rate,
                            type: 1,
                            status: 0
                        } );

                        newInvoice.save()
                            .done( function( err ){
                                if( !!err ){
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else{
                                    newInvoice.name = invoiceNameHasher.encode( newInvoice.order );
                                    newInvoice.save()
                                        .done( function( err ){
                                            if( !!err ){
                                                _this.handleError( err, req, res );
                                                return next();
                                            }
                                            else{
                                                res.send( 201, { invoice: newInvoice } );

                                                logger.info( 'invoice', 'one time platform invoice I-' + newInvoice.name + '[' + newInvoice.id + ']', {
                                                    req: req,
                                                    model: 'invoice',
                                                    model_id: newInvoice.id
                                                } );

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
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};



function createExternalInvoice( req, res, next ){
    req.assert( 'invoice', 'isObject' );
    req.assert( 'invoice.type', 'isNumber' );
    req.assert( 'invoice.to_company_email', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Account.find( {
            where: [
                { id: req.body.invoice.account_id },
                { company_id: req.user.company_id }
            ]
        } ).done( function( err, account ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( _.isEmpty( account ) ){
                res.send( 400, { errors: [ 'Cannot find given account' ] } );
                return next();
            }
            else{
                var newInvoice = Invoice.build( {
                    invoice_date: moment.utc().format(),
                    invoice_period_from: null,
                    invoice_period_to: null,
                    title: req.body.invoice.title,
                    company_id: req.user.company_id,
                    to_company_name: req.body.invoice.to_company_name,
                    to_company_email: req.body.invoice.to_company_email,
                    to_company_phone: req.body.invoice.to_company_phone,
                    to_company_address: req.body.invoice.to_company_address,
                    to_company_city: req.body.invoice.to_company_city,
                    to_company_state_province: req.body.invoice.to_company_state_province,
                    to_company_postal_code: req.body.invoice.to_company_postal_code,
                    to_company_country: req.body.invoice.to_company_country,
                    node_id: null,
                    project_id: null,
                    account_id: account.id,
                    currency_id: account.currency_id,
                    notes: req.body.invoice.notes,
                    parent_id: null,
                    tax_rate: req.body.invoice.tax_rate,
                    type: 2,
                    status: 0
                } );

                newInvoice.save()
                    .done( function( err ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else{
                            newInvoice.name = invoiceNameHasher.encode( newInvoice.order );
                            newInvoice.save()
                                .done( function( err ){
                                    if( !!err ){
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else{
                                        res.send( 201, { invoice: newInvoice } );

                                        logger.info( 'invoice', 'one time platform invoice I-' + newInvoice.name + '[' + newInvoice.id + ']', {
                                            req: req,
                                            model: 'invoice',
                                            model_id: newInvoice.id
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
        util.handleValidationErrors( req, res );
        return next();
    }
};



function createProjectInvoice( req, res, next ){

    req.assert( 'invoice', 'isObject' );
    req.assert( 'invoice.node_id', 'isString' );
    req.assert( 'invoice.project_id', 'isString' );
    req.assert( 'invoice.tax_rate', 'isNumber' );
    req.assert( 'invoice.type', 'isNumber' );

    if( _.isEmpty( req.validationErrors ) ){

        var chainer = new Sequelize.Utils.QueryChainer;
        // Find Project
        chainer.add( Node.find( {
            where: [
                { id: req.body.invoice.node_id },
                { company_id: req.user.company_id }
            ],
            include: [
                {
                    model: NodeItem
                },
                {
                    model: Node,
                    as: 'bnode',
                    include: {
                        model: Company
                    }
                }
            ]
        } ) );

        chainer.add( Project.find( req.body.invoice.project_id ) );

        chainer.runSerially()
            .done( function( err, results ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( _.isEmpty( results[ 0 ] ) ){
                    res.send( 400, { errors: [ 'Invalid node_id' ] } );
                    return next();
                }
                else if( _.isEmpty( results[ 1 ] ) ){
                    res.send( 400, { errors: [ 'Invalid project_id' ] } );
                    return next();
                }
                else{
                    var node = results[ 0 ];
                    var project = results[ 1 ];

                    // Company has access to project and node
                    if( node.project_id == project.id ){
                        var newInvoice = Invoice.build( {
                            invoice_date: moment.utc().format(),
                            invoice_period_from: req.body.invoice.invoice_period_from || null,
                            invoice_period_to: req.body.invoice.invoice_period_to || null,
                            title: req.body.invoice.title,
                            company_id: req.user.company_id,
                            node_id: req.body.invoice.node_id,
                            project_id: project.id,
                            currency_id: project.currency_id,
                            to_company_id: node.bnode.company_id,
                            notes: req.body.invoice.notes,
                            parent_id: req.body.invoice.parent_id,
                            tax_rate: req.body.invoice.tax_rate,
                            type: 0,
                            status: 0
                        } );
                        // For linear project, look for parent invoice and mark it modified
                        //  return new items or empty array
                        newInvoice.save().then( function(){
                            newInvoice.name = invoiceNameHasher.encode( newInvoice.order );
                            return newInvoice.save();
                        } ).then( function(){
                            return _newInvoiceItems( project, newInvoice, node );
                        } ).then( function( results ){
                            var invoiceItems = [];
                            var invoiceItemIds = [];

                            for( var i = 0; i < results.length; i++ ){
                                invoiceItems.push( results[ i ] );
                                invoiceItemIds.push( results[ i ].id );
                            }

                            newInvoice.values.invoice_items = invoiceItemIds;
                            newInvoice.values.invoiceItems = invoiceItems;
                            
                            res.send( 201, {
                                invoice: newInvoice,
                                invoiceItems: invoiceItems
                            } );

                            logger.info( 'invoice', 'I-' + newInvoice.name + '[' + newInvoice.id + '] for P-' + project.name, {
                                req: req,
                                model: 'invoice',
                                model_id: newInvoice.id
                            } );

                            return next();
                        } ).catch( function( err ){
                            _this.handleError( err, req, res );
                            return next();
                        } );

                    }
                    else{
                        res.send( 403 );
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

function _newInvoiceItems( project, newInvoice, node ){
    var promises = [];
    if( project.type === 1 ){
        if( !newInvoice.parent_id ){
            // If node has project items, add them automatically to invoice
            for( var i = 0; i < node.nodeItems.length; i++ ){
                var newItem = InvoiceItem.build( {
                    name: node.nodeItems[ i ].name,
                    unit: '--',
                    price: node.nodeItems[ i ].price,
                    quantity: 0,
                    invoice_id: newInvoice.id
                } );
                promises.push( newItem.save() );
            }
            return Promise.all( promises );
        }
        return Invoice.find( {
            where: {
                id: newInvoice.parent_id
            },
            include: [ { model: InvoiceItem } ]
        } ).then( function( parentInvoice ){
            if( parentInvoice ){
                parentInvoice.status = 2;
                parentInvoice.save();
                if( project.deterministic === 1 ){
                    // loop through parent invoice items
                    // copy items to new invoice and add profit margin to price
                    // save
                    for( var i = 0; i < parentInvoice.invoiceItems.length; i++ ){
                        var newItem = InvoiceItem.build( {
                            name: parentInvoice.invoiceItems[ i ].name,
                            unit: parentInvoice.invoiceItems[ i ].unit,
                            quantity: parentInvoice.invoiceItems[ i ].quantity,
                            price: math.round( ( parentInvoice.invoiceItems[ i ].price / ( 1 - ( node.discount_rate / 100 ) ) ), 5),
                            invoice_id: newInvoice.id
                        } );
                        promises.push( newItem.save() );
                    }
                    return Promise.all( promises );
                }
            }
            return Promise.all( promises );
        } );
    }
    return Promise.resolve( promises );
}





exports.update = function( req, res, next ){

    req.assert( 'invoice_id', 'isString' );
    req.assert( 'invoice', 'isObject' );
    req.assert( 'invoice', 'notEmpty' );

    if( _.isEmpty( req.validationErrors ) ){

        Invoice.find( {
            where: [
                { id: req.params.invoice_id },
                { company_id: req.user.company_id }
            ]
        } )
            .done( function( err, invoice ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !invoice ){
                    res.send( 404 );
                    return next();
                }
                else if( invoice.status !== 0 ){
                    res.send( 400, { errors: [ 'Only can update a draft invoice' ] } );
                    return next();
                }
                else{
                    var validParams = [
                        { key: 'invoice_date', validation: 'isDate' },
                        { key: 'invoice_period_from', validation: 'isDate' },
                        { key: 'invoice_period_to', validation: 'isDate' },
                        { key: 'name', validation: 'isString' },
                        { key: 'title', validation: 'isString' },
                        { key: 'notes', validation: 'isString' },
                        { key: 'tax_rate', validation: 'isNumber' },
                        { key: 'to_company_name', validation: 'isString' },
                        { key: 'to_company_email', validation: 'isString' },
                        { key: 'to_company_phone', validation: 'isString' },
                        { key: 'to_company_address', validation: 'isString' },
                        { key: 'to_company_city', validation: 'isString' },
                        { key: 'to_company_state_province', validation: 'isString' },
                        { key: 'to_company_postal_code', validation: 'isString' },
                        { key: 'to_company_country', validation: 'isString' }
                    ];

                    _.forEach( validParams, function( value ){
                        if( req.params.invoice.hasOwnProperty( value.key ) ){

                            // If the property is allowed null and is being set to null don't run the validation
                            if( Invoice.rawAttributes[ value.key ].allowNull && req.params.invoice[ value.key ] === null ){
                                invoice[ value.key ] = null;
                            }
                            else if( req.assert( 'invoice.' + value.key, value.validation ) === true ){
                                invoice[ value.key ] = req.params.invoice[ value.key ];
                            }
                        }
                    } );

                    if( _.isEmpty( req.validationErrors ) ){
                        invoice.save()
                            .done( function( err ){
                                if( !!err ){
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else{
                                    invoice.values.links = {
                                        invoice_items: '/invoiceItems?invoice_id=' + invoice.id
                                    };

                                    res.send( 200, { invoice: invoice } );

                                    logger.info( 'invoice', 'I-' + invoice.name + '[' + req.params.invoice_id + ']', {
                                        req: req,
                                        model: 'invoice',
                                        model_id: invoice.id
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





exports.activate = function( req, res, next ){

    req.assert( 'invoice_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Invoice.find( {
            where: [
                { id: req.params.invoice_id },
                { company_id: req.user.company_id }
            ],
            include: [
                { model: InvoiceItem },
                { model: Currency },
                { model: Company },
                { model: Node },
                { model: Project }
            ]
        } )
            .done( function( err, invoice ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !invoice ){
                    res.send( 404 );

                    logger.error( 'invoice', 'invoice not found for [' + req.params.invoice_id + ']', {
                        req: req
                    } );

                    return next();
                }
                else if( invoice.status !== 0 ){
                    res.send( 400, { errors: [ 'Only can activate a draft invoice' ] } );
                    return next();
                }
                else{
                    // Calculate Total Amount
                    invoice.amount = 0;
                    for( var i = 0; i < invoice.invoiceItems.length; i++ ){
                        invoice.amount += invoice.invoiceItems[ i ].price * invoice.invoiceItems[ i ].quantity;
                    }

                    // If amount is < 0, set it to 0
                    if( invoice.amount < 0 ){
                        invoice.amount = 0;
                    }

                    // Empty invoice
                    if( invoice.invoiceItems.length == 0 ){
                        res.send( 400, { errors: [ 'Cannot send an empty invoice.' ] } );
                        return next();
                    }
                    else{
                        var tax = invoice.amount * invoice.tax_rate / 100;
                        tax = math.round( tax, 2 );
                        var totalAmount = invoice.amount + tax;
                        invoice.remaining_amount = totalAmount;
                        invoice.status = 1;
                        invoice.save()
                            .done( function( err ){
                                if( !!err ){
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else{
                                    res.send( 200, { invoice: invoice } );

                                    if( invoice.type === 0 ){
                                        return activateProjectInvoice( req, res, next, invoice );
                                    }
                                    else if( invoice.type === 1 ){
                                        return activatePlatformInvoice( req, res, next, invoice );
                                    }
                                    else if( invoice.type === 2 ){
                                        return activateExternalInvoice( req, res, next, invoice );
                                    }

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



function activateProjectInvoice( req, res, next, invoice ){
    // Notify the company
    Node.find( {
        where: [
            { id: invoice.node.parent_id }
        ],
        include: [
            { model: Company }
        ]
    } ).done( function( err, bnode ){
        if( !!err ){
            logger.critical( err.message, { req: req } );
        }
        else{
            notifier.notifyCompany( 'akx-invoice-sent', invoice.company.id, {
                to_company_name: bnode.company.name + ' (XYZ' + bnode.company.account_number + ')',
                invoice_name: 'I-' + invoice.name
            }, req );
            notifier.notifyCompany( 'akx-invoice-received', bnode.company.id, {
                from_company_name: invoice.company.name + ' (XYZ' + invoice.company.account_number + ')',
                invoice_name: 'I-' + invoice.name
            }, req );
        }
    } );

    logger.info( 'invoice', 'I-' + invoice.name + '[' + req.params.invoice_id + '] status changed to 1 (activated)', {
        req: req,
        model: 'invoice',
        model_id: invoice.id
    } );

    return next();
}



function activatePlatformInvoice( req, res, next, invoice ){
    // Notify the company
    Company.find( {
        where: [
            { id: invoice.to_company_id }
        ]
    } ).done( function( err, toCompany ){
        if( !!err ){
            logger.critical( err.message, { req: req } );
        }
        else{
            notifier.notifyCompany( 'akx-invoice-sent', invoice.company.id, {
                to_company_name: toCompany.name + ' (XYZ' + toCompany.account_number + ')',
                invoice_name: 'I-' + invoice.name
            }, req );
            notifier.notifyCompany( 'akx-invoice-received', toCompany.id, {
                from_company_name: invoice.company.name + ' (XYZ' + invoice.company.account_number + ')',
                invoice_name: 'I-' + invoice.name
            }, req );
        }
    } );

    logger.info( 'invoice', 'on platform invoice I-' + invoice.name + '[' + req.params.invoice_id + '] status changed to 1 (activated)', {
        req: req,
        model: 'invoice',
        model_id: invoice.id
    } );

    return next();
}



function activateExternalInvoice( req, res, next, invoice ){

    var hashids = new Hashids( hashidConfig, 10 );

    var invoice_items = [];
    _.forEach( invoice.invoiceItems, function( item ){
        var newItem = {
            name: item.name,
            price: invoice.currency.symbol + Globalize.format( item.price, 'n5' ),
            quantity: item.quantity,
            subtotal: invoice.currency.symbol + Globalize.format( item.price * item.quantity, 'n2' )
        };

        invoice_items.push( newItem );
    } );

    var invoice_tax = math.round( invoice.amount * invoice.tax_rate / 100, 2 );
    var invoice_total = invoice.amount + invoice_tax;

    notifier.notifyExternal(
        'akx-invoice-external',
        invoice.to_company_email,
        invoice.to_company_name, {
            company_name: invoice.company.name,
            company_account_number: invoice.company.account_number,
            company_address: invoice.company.address,
            company_city: invoice.company.city,
            company_state_province: invoice.company.state_province,
            company_postal_code: invoice.company.postal_code,
            company_country: invoice.company.country,
            company_phone: invoice.company.phone,
            company_email: invoice.company.email,
            to_company_name: invoice.to_company_name,
            to_company_email: invoice.to_company_email,
            to_company_phone: invoice.to_company_phone,
            to_company_address: invoice.to_company_address,
            to_company_city: invoice.to_company_city,
            to_company_state_province: invoice.to_company_state_province,
            to_company_postal_code: invoice.to_company_postal_code,
            to_company_country: invoice.to_company_country,
            invoice_items: invoice_items,
            invoice_id: 'I-' + invoice.name,
            url: 'https://xxx.com/external/' + hashids.encode( Number( invoice.order ) ),
            invoice_name: invoice.title,
            invoice_tax: invoice.currency.symbol + Globalize.format( invoice_tax, 'n2' ),
            invoice_total: invoice.currency.symbol + Globalize.format( invoice_total, 'n2' ),
            invoice_date: Globalize.format( invoice.invoice_date, 'd' ),
            invoice_notes: invoice.notes
        },
        req
    );

    logger.info( 'invoice', 'external invoice I-' + invoice.name + '[' + req.params.invoice_id + '] status changed to 1 (activated)', {
        req: req,
        model: 'invoice',
        model_id: invoice.id
    } );

    return next();
}



exports.recall = function( req, res, next ){

    req.assert( 'invoice_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        Invoice.find( {
            where: [
                { id: req.params.invoice_id },
                { company_id: req.user.company_id }
            ]
        } )
            .done( function( err, invoice ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !invoice ){
                    res.send( 404 );
                    return next();
                }
                else{
                    if( invoice.status === 1 ){
                        invoice.status = 0;
                        invoice.save().done( function( err ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else{
                                res.send( 200, { invoice: invoice } );

                                logger.info( 'invoice', 'I-' + invoice.name + '[' + req.params.invoice_id + '] changed to status 0 (recalled)', {
                                    req: req,
                                    model: 'invoice',
                                    model_id: invoice.id
                                } );

                                return next();
                            }
                        } );
                    }
                    else{
                        res.send( 400, { errors: [ 'No actions can be performed on this invoice.' ] } );
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





exports.markPaid = function( req, res, next ){

    req.assert( 'invoice_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        Invoice.find( {
            where: [
                { id: req.params.invoice_id },
                { company_id: req.user.company_id }
            ]
        } )
            .done( function( err, invoice ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !invoice ){
                    res.send( 404 );
                    return next();
                }
                else{
                    if( invoice.status === 1 || invoice.status === 2 ){
                        invoice.status = 3;
                        invoice.remaining_amount = 0;
                        invoice.save().done( function( err ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else{
                                res.send( 200, { invoice: invoice } );

                                logger.info( 'invoice', 'I-' + invoice.name + '[' + req.params.invoice_id + '] changed to status 3 (paid)', {
                                    req: req,
                                    model: 'invoice',
                                    model_id: invoice.id
                                } );

                                return next();
                            }
                        } );
                    }
                    else{
                        res.send( 400, { errors: [ 'No actions can be performed on this invoice.' ] } );
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





exports.pay = function( req, res, next ){

    req.assert( 'invoice_id', 'isString' );
    req.assert( 'data', 'isObject' );
    req.assert( 'data.amount', 'isNumber' );

    if( _.isEmpty( req.validationErrors ) ){

        if( req.body.data.amount <= 0 ){
            res.send( 400, { errors: [ 'Payment amount needs to be greater than 0' ] } );
            return next();
        }
        else{

            Invoice.find( {
                where: [
                    { id: req.params.invoice_id }
                ],
                include: [
                    { model: InvoiceItem },
                    { model: Project }
                ]
            } )
                .done( function( err, invoice ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else if( !invoice ){
                        res.send( 404 );
                        return next();
                    }
                    else if( invoice.status !== 1 && invoice.status !== 2 ){
                        res.send( 400, { errors: [ 'Invoice must be pending or partially paid' ] } );
                        return next();
                    }
                    else{
                        // Project invoice
                        if( invoice.type === 0 ){
                            if( invoice.project.type === 0 || invoice.project.deterministic ){
                                payTree( req, res, next, invoice );
                            }
                            else{
                                payLinear( req, res, next, invoice );
                            }
                        }
                        else if( invoice.type === 1 ){
                            payPlatform( req, res, next, invoice );
                        }
                    }
                } );
        }
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};



function payPlatform( req, res, next, invoice ){
    req.assert( 'data.account_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        if( invoice.to_company_id !== req.user.company_id ){
            res.send( 400, { errors: [ 'You are not allowed to pay for this invoice' ] } );
            return next();
        }
        else{
            Account.find( {
                where: [
                    { id: req.body.data.account_id },
                    { company_id: req.user.company_id }
                ],
                include: [
                    { model: Currency },
                    {
                        model: Company,
                        include: [ Fee ]
                    }
                ]
            } ).done( function( err, account ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( _.isEmpty( account ) ){
                    res.send( 400, { errors: [ 'Cannot find given account' ] } );
                    return next();
                }
                else{
                    if( account.balance < req.body.data.amount ){
                        res.send( 400, { errors: [ 'Insufficient fund to pay this amount.' ] } );
                        return next();
                    }
                    else{
                        Account.find( {
                            where: [
                                { id: invoice.account_id },
                                { company_id: invoice.company_id }
                            ],
                            include: [
                                { model: Currency },
                                {
                                    model: Company,
                                    status: [ 1, 2 ],
                                    include: [ Fee ]
                                }
                            ]
                        } ).done( function( err, toAccount ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else if( _.isEmpty( toAccount ) ){
                                res.send( 400, { errors: [ 'Cannot find invoice credit account' ] } );
                                return next();
                            }
                            else if( account.currency_id !== toAccount.currency_id ){
                                res.send( 400, { errors: [ 'Wrong currency type' ] } );
                                return next();
                            }
                            else{
                                Transaction.findAll( {
                                    where: [
                                        { model: 'invoice' },
                                        { model_id: invoice.id },
                                        { type: 1 },
                                        { status: [ 0, 1 ] }
                                    ]
                                } ).done( function( err, payments ){
                                    if( !!err ){
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else{
                                        var AC = req.body.data.amount;
                                        var paidAmount = 0;
                                        for( var i = 0; i < payments.length; i++ ){
                                            paidAmount += payments[ i ].amount;
                                        }

                                        // Tax
                                        var tax = invoice.amount * invoice.tax_rate / 100;
                                        tax = math.round( tax, 2 );
                                        var totalAmount = invoice.amount + tax;

                                        var remainingAmount = math.round( totalAmount - paidAmount, 2 );
                                        if( remainingAmount < req.body.data.amount ){
                                            AC = remainingAmount;
                                        }
                                        if( remainingAmount === 0 ){
                                            if( invoice.status !== 3 ){
                                                invoice.status = 3;
                                                invoice.remaining_amount = 0;
                                                invoice.save();
                                            }
                                            logger.info( 'invoice', 'paid I-' + invoice.name + '[' + invoice.id + '] paid amount=' + req.params.data.amount, {
                                                req: req,
                                                model: 'invoice',
                                                model_id: invoice.id
                                            } );
                                            res.send( 200, { invoice: invoice } );
                                            return next();
                                        }

                                        var feeBuyer = math.round( account.company.fee.getInvoiceOutRate() * AC, 2 );
                                        var feeReceiver = math.round( toAccount.company.fee.getInvoiceInRate() * AC, 2 );

                                        if( account.balance < AC + feeBuyer ){
                                            res.send( 400, { errors: [ 'Insufficient fund to pay this amount.' ] } );
                                            return next();
                                        }
                                        else{
                                            //
                                            var invoiceTransaction = Transaction.build( {
                                                currency_id: invoice.currency_id,
                                                from_account_id: account.id,
                                                to_account_id: toAccount.id,
                                                model: 'invoice',
                                                model_id: invoice.id,
                                                amount: AC,
                                                type: 1,
                                                status: 1
                                            } );

                                            invoiceTransaction.save().success( function(){
                                                if( feeBuyer != 0 ){
                                                    var feeBuyerTransaction = Transaction.build( {
                                                        currency_id: invoice.currency_id,
                                                        from_account_id: account.id,
                                                        to_account_id: account.currency.fee_invoice_account_id,
                                                        parent_id: invoiceTransaction.id,
                                                        model: 'invoice',
                                                        model_id: invoice.id,
                                                        amount: feeBuyer,
                                                        type: 3,
                                                        status: 0
                                                    } );
                                                    feeBuyerTransaction.save();
                                                }
                                                if( feeReceiver != 0 ){
                                                    var feeReceiverTransaction = Transaction.build( {
                                                        currency_id: invoice.currency_id,
                                                        from_account_id: toAccount.id,
                                                        to_account_id: toAccount.currency.fee_invoice_account_id,
                                                        parent_id: invoiceTransaction.id,
                                                        model: 'invoice',
                                                        model_id: invoice.id,
                                                        amount: feeReceiver,
                                                        type: 3,
                                                        status: 0
                                                    } );
                                                    feeReceiverTransaction.save();
                                                }
                                                account.balance = math.round( account.balance - ( AC + feeBuyer ), 2 );
                                                account.save();
                                                toAccount.balance = math.round( toAccount.balance + AC - feeReceiver, 2 );
                                                toAccount.save();

                                                invoice.status = 2;
                                                invoice.remaining_amount = math.round( totalAmount - paidAmount - AC, 2 );
                                                if( AC === remainingAmount ){
                                                    invoice.status = 3;
                                                    invoice.remaining_amount = 0;
                                                }
                                                invoice.save();

                                                logger.info( 'invoice', 'paid I-' + invoice.name + '[' + invoice.id + '] paid amount=' + AC, {
                                                    req: req,
                                                    model: 'invoice',
                                                    model_id: invoice.id
                                                } );

                                                if( invoice.status === 3 ){
                                                    logger.info( 'invoice', 'I-' + invoice.name + '[' + invoice.id + '] changed to status 3 (paid)', {
                                                        req: req,
                                                        model: 'invoice',
                                                        model_id: invoice.id
                                                    } );
                                                }
                                                notifier.notifyCompany( 'akx-invoice-payment-received', invoice.company_id, {
                                                    amount: Globalize.format( req.params.data.amount, 'n2' ),
                                                    invoice_name: 'I-' + invoice.name,
                                                    from_company: account.company.name,
                                                    currency: account.currency.symbol
                                                }, req );

                                                notifier.notifyCompany( 'akx-invoice-payment-sent', invoice.to_company_id, {
                                                    amount: Globalize.format( req.params.data.amount, 'n2' ),
                                                    invoice_name: 'I-' + invoice.name,
                                                    to_company: toAccount.company.name,
                                                    currency: toAccount.currency.symbol
                                                }, req );

                                                res.send( 200, { invoice: invoice } );
                                                return next();

                                            } );
                                        }
                                    }
                                } );
                            }
                        } );
                    }
                }
            } );
        }
    }
}


function payLinear( req, res, next, invoice ){

    var chainer = new Sequelize.Utils.QueryChainer;
    // Find relevant objects
    chainer.add( Node.find( {
        where: {
            id: invoice.node_id
        },
        include: [
            {
                model: Company,
                include: [ Fee ]
            }
        ]
    } ) );
    chainer.add( Node.findAll( {
        where: [
            { parent_id: invoice.node_id },
            { status: [ 0, 1 ] }
        ]
    } ) );
    chainer.add( Transaction.findAll( {
        where: [
            { model: 'invoice' },
            { model_id: invoice.id },
            { type: 1 },
            { status: [ 0, 1 ] }
        ]
    } ) );
    chainer.add( Currency.find( invoice.currency_id ) );
    chainer.add( Invoice.find( invoice.parent_id ) );
    chainer.add( Transaction.findAll( {
        where: [
            { model: 'invoice' },
            { model_id: invoice.parent_id },
            { type: 1 },
            { status: [ 0, 1 ] }
        ]
    } ) );
    chainer.add( Company.find( invoice.to_company_id ) );

    chainer.runSerially().success( function( results ){
        var node = results[ 0 ];
        var snodes = results[ 1 ];
        var payments = results[ 2 ];
        var currency = results[ 3 ];
        var parentInvoice = results[ 4 ];
        var parentPayments = results[ 5 ];
        var toCompany = results [ 6 ];

        chainer = new Sequelize.Utils.QueryChainer;
        chainer.add( Node.find( {
            where: {
                id: node.parent_id
            },
            include: [
                {
                    model: Company,
                    include: [ Fee ]
                }
            ]
        } ) );
        chainer.add( Account.find( node.account_id ) );
        chainer.add( Company.find( invoice.company_id ) );
        if( parentInvoice !== null ){
            chainer.add( Node.find( parentInvoice.node_id ) );
        }
        chainer.runSerially().success( function( results ){
            var bnode = results[ 0 ];
            var toAccount = results[ 1 ];
            var fromCompany = results[ 2 ];
            if( parentInvoice !== null ){
                var parentInvoiceNode = results[ 3 ];
            }

            chainer = new Sequelize.Utils.QueryChainer;
            chainer.add( Account.find( bnode.account_id ) );
            chainer.runSerially().success( function( results ){
                var fromAccount = results[ 0 ];

                // Calculate amount already paid
                var paidAmount = 0;
                for( var i = 0; i < payments.length; i++ ){
                    paidAmount += payments[ i ].amount;
                }
                // Tax
                var tax = invoice.amount * invoice.tax_rate / 100;
                tax = math.round( tax, 2 );
                var totalAmount = invoice.amount + tax;
                var remainingAmount = math.round( totalAmount - paidAmount, 2 );
                if( remainingAmount == 0 ){
                    if( invoice.status !== 3 ){
                        invoice.status = 3;
                        invoice.save();
                    }
                    logger.info( 'invoice', 'paid I-' + invoice.name + '[' + invoice.id + '] paid amount=' + req.params.data.amount, {
                        req: req,
                        model: 'invoice',
                        model_id: invoice.id
                    } );
                    res.send( 200, { invoice: invoice } );
                    return next();
                }

                // Use PG before PC
                var A = req.body.data.amount;
                var AG = Math.min( node.points_guarantee, Math.min( A, remainingAmount ) );
                var AC = Math.min( node.points_cash + fromAccount.balance, ( Math.min( A, remainingAmount ) - AG ) );
                // fees
                var feeBuyer = math.round( bnode.company.fee.getInvoiceOutRate() * AC, 2 );
                if( bnode.company.fee.getInvoiceOutRate() === 0 ){
                    feeBuyer = 0;
                }
                var feeDiff = Math.max( node.fee_counter - bnode.fee_counter * node.company.fee.getInvoiceInRate() / bnode.company.fee.getInvoiceOutRate(), 0 );
                // Paid more than remaining invoice
                var remainingAmountWithFee = math.round( ( remainingAmount - AG ), 2 );
                if( remainingAmountWithFee < ( A - AG ) ){
                    AC = remainingAmountWithFee;
                    if( bnode.company.fee.getInvoiceOutRate() === 0 ){
                        feeBuyer = 0;
                        feeDiff = 0;
                    }
                    else{
                        feeBuyer = math.round( ( remainingAmount - AG ) * bnode.company.fee.getInvoiceOutRate(), 2 );
                    }
                }
                var receiverAmount = math.round( AC + AG, 2 );
                var feeReceiver = math.round( node.company.fee.getInvoiceInRate() * receiverAmount, 2 );
                if( node.company.fee.getInvoiceInRate() === 0 ){
                    feeReceiver = 0;
                }
                else{
                    feeReceiver = math.round( Math.max( feeReceiver - feeDiff, 0 ), 2 );
                }
                // Check if there is enough money to pay this amount
                if( ( AG + AC + feeBuyer ) > ( node.points_cash + node.points_guarantee + fromAccount.balance ) || ( AG + AC ) === 0 ){
                    res.send( 400, { errors: [ 'Insufficient fund to pay this amount.' ] } );
                    return next();
                }
                else{
                    // PG for children nodes
                    var PG1 = 0;
                    if( parentInvoice !== null ){
                        // Get the Obligations amount, in this case will be outstanding parent invoice's remaining balance minus existing points_cash
                        // Calculate amount already paid
                        var parentPaidAmount = 0;
                        for( var i = 0; i < parentPayments.length; i++ ){
                            parentPaidAmount += parentPayments[ i ].amount;
                        }
                        // Tax
                        var parentTax = parentInvoice.amount * parentInvoice.tax_rate / 100;
                        parentTax = math.round( parentTax, 2 );
                        var parentTotalAmount = parentInvoice.amount + parentTax;
                        var parentRemainingAmount = math.round( parentTotalAmount - parentPaidAmount, 2 );
                        PG1 = Math.max( parentRemainingAmount - parentInvoiceNode.points_cash - parentInvoiceNode.points_guarantee, 0 );
                    }
                    var O = Math.min( PG1, AG + AC - feeReceiver );
                    var Profit = Math.max( AG + AC - O - feeReceiver, 0 );
                    // Update current node
                    var pointsCashDeficit = AC + feeBuyer - node.values.points_cash;
                    node.values.fee_counter = math.round( node.values.fee_counter + feeReceiver, 2 );
                    node.values.points_guarantee = math.round( node.values.points_guarantee - AG, 2 );
                    node.values.points_cash = Math.max( math.round( node.values.points_cash - AC - feeBuyer, 2 ), 0 );
                    node.save();
                    if( pointsCashDeficit > 0 ){
                        fromAccount.balance = math.round( fromAccount.balance - pointsCashDeficit, 2 );
                        fromAccount.save();
                    }
                    // Update buyer node
                    bnode.values.fee_counter = math.round( bnode.values.fee_counter + feeBuyer, 2 );
                    bnode.save();
                    toAccount.balance = math.round( toAccount.balance + Profit, 2 );
                    toAccount.save();

                    // Update invoice
                    invoice.status = 2;
                    invoice.remaining_amount = math.round( totalAmount - paidAmount - receiverAmount, 2 );
                    // Close the invoice if paid in full
                    if( receiverAmount === remainingAmount ){
                        invoice.status = 3;
                        invoice.remaining_amount = 0;
                    }
                    invoice.save();

                    // Create Transactions
                    var invoiceTransaction = Transaction.build( {
                        currency_id: invoice.currency_id,
                        from_account_id: fromAccount.id,
                        to_account_id: toAccount.id,
                        model: 'invoice',
                        model_id: invoice.id,
                        amount: receiverAmount,
                        type: 1,
                        status: 1
                    } );

                    invoiceTransaction.save().success( function(){
                        if( feeBuyer != 0 ){
                            var feeBuyerTransaction = Transaction.build( {
                                currency_id: invoice.currency_id,
                                from_account_id: fromAccount.id,
                                to_account_id: currency.fee_invoice_account_id,
                                parent_id: invoiceTransaction.id,
                                model: 'invoice',
                                model_id: invoice.id,
                                amount: feeBuyer,
                                type: 3,
                                status: 0
                            } );
                            feeBuyerTransaction.save();
                        }
                        if( feeReceiver != 0 ){
                            var feeReceiverTransaction = Transaction.build( {
                                currency_id: invoice.currency_id,
                                from_account_id: toAccount.id,
                                to_account_id: currency.fee_invoice_account_id,
                                parent_id: invoiceTransaction.id,
                                model: 'invoice',
                                model_id: invoice.id,
                                amount: feeReceiver,
                                type: 3,
                                status: 0
                            } );
                            feeReceiverTransaction.save();
                        }
                    } );

                    if( parentInvoice !== null && O >= 0 ){
                        // auto point obligation amount to PG of parent invoice's node
                        parentInvoiceNode.points_guarantee += O;
                        parentInvoiceNode.save();

                        var nodeTransaction = Transaction.build( {
                            currency_id: invoice.currency_id,
                            from_account_id: toAccount.id,
                            model: 'node',
                            model_id: parentInvoiceNode.id,
                            amount: O,
                            type: 2,
                            status: 1
                        } );
                        nodeTransaction.save();
                    }

                    logger.info( 'invoice', 'paid I-' + invoice.name + '[' + invoice.id + '] paid amount=' + req.params.data.amount, {
                        req: req,
                        model: 'invoice',
                        model_id: invoice.id
                    } );

                    if( invoice.status === 3 ){
                        logger.info( 'invoice', 'I-' + invoice.name + '[' + invoice.id + '] changed to status 3 (paid)', {
                            req: req,
                            model: 'invoice',
                            model_id: invoice.id
                        } );
                    }
                    notifier.notifyCompany( 'akx-invoice-payment-received', invoice.company_id, {
                        amount: Globalize.format( req.params.data.amount, 'n2' ),
                        invoice_name: 'I-' + invoice.name,
                        from_company: toCompany.name,
                        currency: currency.symbol

                    }, req );

                    notifier.notifyCompany( 'akx-invoice-payment-sent', invoice.to_company_id, {
                        amount: Globalize.format( req.params.data.amount, 'n2' ),
                        invoice_name: 'I-' + invoice.name,
                        to_company: fromCompany.name,
                        currency: currency.symbol
                    }, req );

                    res.send( 200, { invoice: invoice } );
                    return next();
                }
            } );
        } );
    } );
}



function payTree( req, res, next, invoice ){

    var chainer = new Sequelize.Utils.QueryChainer;
    // Find relevant objects
    chainer.add( Node.find( {
        where: {
            id: invoice.node_id
        },
        include: [
            {
                model: Company,
                include: [ Fee ]
            }
        ]
    } ) );
    chainer.add( Node.findAll( {
        where: [
            { parent_id: invoice.node_id },
            { status: [ 0, 1 ] }
        ]
    } ) );
    chainer.add( Transaction.findAll( {
        where: [
            { model: 'invoice' },
            { model_id: invoice.id },
            { type: 1 },
            { status: [ 0, 1 ] }
        ]
    } ) );
    chainer.add( Currency.find( invoice.currency_id ) );
    chainer.add( Company.find( invoice.to_company_id ) );

    chainer.runSerially().success( function( results ){
        var node = results[ 0 ];
        var snodes = results[ 1 ];
        var payments = results[ 2 ];
        var currency = results[ 3 ];
        var toCompany = results[ 4 ];

        chainer = new Sequelize.Utils.QueryChainer;
        chainer.add( Node.find( {
            where: {
                id: node.parent_id
            },
            include: [
                {
                    model: Company,
                    include: [ Fee ]
                }
            ]
        } ) );
        chainer.add( Account.find( node.account_id ) );
        chainer.add( Company.find( invoice.company_id ) );
        chainer.runSerially().success( function( results ){
            var bnode = results[ 0 ];
            var toAccount = results[ 1 ];
            var fromCompany = results[ 2 ];

            chainer = new Sequelize.Utils.QueryChainer;
            chainer.add( Account.find( bnode.account_id ) );
            chainer.runSerially().success( function( results ){
                var fromAccount = results[ 0 ];

                // Calculate amount already paid
                var paidAmount = 0;
                for( var i = 0; i < payments.length; i++ ){
                    paidAmount += payments[ i ].amount;
                }
                // Tax
                var tax = invoice.amount * invoice.tax_rate / 100;
                tax = math.round( tax, 2 );
                var totalAmount = invoice.amount + tax;
                var remainingAmount = math.round( totalAmount - paidAmount, 2 );
                if( remainingAmount === 0 ){
                    if( invoice.status !== 3 ){
                        invoice.status = 3;
                        invoice.remaining_amount = 0;
                        invoice.save();
                    }
                    logger.info( 'invoice', 'paid I-' + invoice.name + '[' + invoice.id + '] paid amount=' + req.params.data.amount, {
                        req: req,
                        model: 'invoice',
                        model_id: invoice.id
                    } );
                    res.send( 200, { invoice: invoice } );
                    return next();
                }

                // Use PG before PC
                var A = req.body.data.amount;
                var AG = Math.min( node.points_guarantee, Math.min( A, remainingAmount ) );
                var AC = Math.min( node.points_cash + fromAccount.balance, ( Math.min( A, remainingAmount ) - AG ) );
                // fees
                var feeDiff = Math.max( node.fee_counter - bnode.fee_counter * node.company.fee.getInvoiceInRate() / bnode.company.fee.getInvoiceOutRate(), 0 );
                var feeBuyer = math.round( bnode.company.fee.getInvoiceOutRate() * AC, 2 );
                if( bnode.company.fee.getInvoiceOutRate() === 0 ){
                    feeBuyer = 0;
                    feeDiff = 0;
                }
                // Paid more than remaining invoice
                var remainingAmountWithFee = math.round( ( remainingAmount - AG ), 2 );
                if( remainingAmountWithFee < ( A - AG ) ){
                    AC = remainingAmountWithFee;
                    if( bnode.company.fee.getInvoiceOutRate() === 0 ){
                        feeBuyer = 0;
                    }
                    else{
                        feeBuyer = math.round( ( remainingAmount - AG ) * bnode.company.fee.getInvoiceOutRate(), 2 );
                    }
                }
                var receiverAmount = math.round( AC + AG, 2 );
                var feeReceiver = math.round( node.company.fee.getInvoiceInRate() * receiverAmount, 2 );
                if( node.company.fee.getInvoiceInRate() === 0 ){
                    feeReceiver = 0;
                }
                else{
                    feeReceiver = math.round( Math.max( feeReceiver - feeDiff, 0 ), 2 );
                }
                // Check if there is enough money to pay this amount
                if( ( AG + AC + feeBuyer ) > ( node.points_cash + node.points_guarantee + fromAccount.balance ) || ( AG + AC ) === 0 ){
                    res.send( 400, { errors: [ 'Insufficient fund to pay this amount.' ] } );
                    return next();
                }
                else{
                    // PG for children nodes
                    var PG1 = 0;
                    if( snodes != null ){
                        // Get the Obligations amount, in this case it's the amount pointed forward
                        for( var i = 0; i < snodes.length; i++ ){
                            PG1 += snodes[ i ].points;
                        }
                    }
                    var O = Math.min( PG1, AG + AC - feeReceiver );
                    var Profit = Math.max( AG + AC - O - feeReceiver, 0 );
                    // Update current node
                    var pointsCashDeficit = AC + feeBuyer - node.values.points_cash;
                    node.values.fee_counter = math.round( node.values.fee_counter + feeReceiver, 2 );
                    node.values.points_guarantee = math.round( node.values.points_guarantee - AG, 2 );
                    node.values.points_cash = Math.max( math.round( node.values.points_cash - AC - feeBuyer, 2 ), 0 );
                    node.save();
                    if( pointsCashDeficit > 0 ){
                        fromAccount.balance = math.round( fromAccount.balance - pointsCashDeficit, 2 );
                        fromAccount.save();
                    }
                    // Update buyer node
                    bnode.values.fee_counter = math.round( bnode.values.fee_counter + feeBuyer, 2 );
                    bnode.save();

                    toAccount.balance = math.round( toAccount.balance + Profit, 2 );
                    toAccount.save();

                    // Update invoice
                    invoice.status = 2;
                    invoice.remaining_amount = math.round( totalAmount - paidAmount - receiverAmount, 2 );
                    // Close the invoice if paid in full
                    if( receiverAmount === remainingAmount ){
                        invoice.status = 3;
                        invoice.remaining_amount = 0;
                    }
                    invoice.save();

                    // Create Transactions
                    var invoiceTransaction = Transaction.build( {
                        currency_id: invoice.currency_id,
                        from_account_id: fromAccount.id,
                        to_account_id: toAccount.id,
                        model: 'invoice',
                        model_id: invoice.id,
                        amount: receiverAmount,
                        type: 1,
                        status: 1
                    } );

                    invoiceTransaction.save().success( function(){
                        if( feeBuyer != 0 ){
                            var feeBuyerTransaction = Transaction.build( {
                                currency_id: invoice.currency_id,
                                from_account_id: fromAccount.id,
                                to_account_id: currency.fee_invoice_account_id,
                                parent_id: invoiceTransaction.id,
                                model: 'invoice',
                                model_id: invoice.id,
                                amount: feeBuyer,
                                type: 3,
                                status: 0
                            } );
                            feeBuyerTransaction.save();
                        }
                        if( feeReceiver != 0 ){
                            var feeReceiverTransaction = Transaction.build( {
                                currency_id: invoice.currency_id,
                                from_account_id: toAccount.id,
                                to_account_id: currency.fee_invoice_account_id,
                                parent_id: invoiceTransaction.id,
                                model: 'invoice',
                                model_id: invoice.id,
                                amount: feeReceiver,
                                type: 3,
                                status: 0
                            } );
                            feeReceiverTransaction.save();
                        }
                    } );

                    if( snodes != null ){
                        // O -= feeReceiver;
                        // Convert regular points to points guarantee in children nodes
                        for( var i = 0; i < snodes.length; i++ ){
                            if( snodes[ i ].points != 0 ){
                                var Oamount = Math.min( snodes[ i ].points, O );
                                if( Oamount != 0 ){
                                    snodes[ i ].points -= Oamount;
                                    snodes[ i ].points_guarantee += Oamount;
                                    O = math.round( O - Oamount, 2 );
                                    snodes[ i ].save();

                                    var nodeTransaction = Transaction.build( {
                                        currency_id: invoice.currency_id,
                                        from_account_id: toAccount.id,
                                        model: 'node',
                                        model_id: snodes[ i ].id,
                                        amount: Oamount,
                                        type: 2,
                                        status: 1
                                    } );
                                    nodeTransaction.save();
                                }
                            }
                        }
                    }

                    logger.info( 'invoice', 'paid I-' + invoice.name + '[' + invoice.id + '] paid amount=' + req.params.data.amount, {
                        req: req,
                        model: 'invoice',
                        model_id: invoice.id
                    } );

                    if( invoice.status === 3 ){
                        logger.info( 'invoice', 'I-' + invoice.name + '[' + invoice.id + '] changed to status 3 (paid)', {
                            req: req,
                            model: 'invoice',
                            model_id: invoice.id
                        } );
                    }
                    notifier.notifyCompany( 'akx-invoice-payment-received', invoice.company_id, {
                        amount: Globalize.format( req.params.data.amount, 'n2' ),
                        invoice_name: 'I-' + invoice.name,
                        from_company: toCompany.name,
                        currency: currency.symbol
                    }, req );

                    notifier.notifyCompany( 'akx-invoice-payment-sent', invoice.to_company_id, {
                        amount: Globalize.format( req.params.data.amount, 'n2' ),
                        invoice_name: 'I-' + invoice.name,
                        to_company: fromCompany.name,
                        currency: currency.symbol
                    }, req );
                    res.send( 200, { invoice: invoice } );
                    return next();
                }
            } );
        } );
    } );
};





exports.canCreateChild = function( req, res, next ){

    req.assert( 'invoice_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Invoice.find( {
            where: {
                id: req.params.invoice_id
            },
            include: [
                { model: Node },
                { model: Project }
            ]
        } )
            .done( function( err, invoice ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{
                    // Is tree project, false
                    if( invoice.project.type === 0 ){
                        res.send( 200, { canCreateChild: false } );
                        return next();
                    }
                    else{
                        Node.find( {
                            where: [
                                { id: invoice.node.parent_id }
                            ]
                        } ).done( function( err, parentNode ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else if( !parentNode ){

                                // Something is wrong if this condition is met
                                res.send( 200, { canCreateChild: false } );
                                return next();
                            }
                            else if( parentNode.parent_id === null ){

                                // If payer is end buyer, false
                                res.send( 200, { canCreateChild: false } );
                                return next();
                            }
                            else{
                                Invoice.find( {
                                    where: {
                                        parent_id: invoice.id,
                                        status: [ 0, 1, 2, 3 ]
                                    }
                                } ).done( function( err, childInvoice ){
                                    if( !!err ){
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    // Has already created an invoice
                                    else if( !childInvoice ){
                                        res.send( 200, { canCreateChild: true } );
                                        return next();
                                    }
                                    else{
                                        res.send( 200, { canCreateChild: false } );
                                        return next();
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





exports.delete = function( req, res, next ){

    req.assert( 'invoice_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Invoice.find( {
            where: [
                { id: req.params.invoice_id },
                { company_id: req.user.company_id }
            ]
        } )
            .done( function( err, invoice ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !invoice ){
                    res.send( 404 );
                    return next();
                }
                else{
                    if( invoice.status === 0 ){
                        invoice.status = 4;
                        invoice.save().done( function( err ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else{
                                res.send( 200, { invoice: invoice } );

                                logger.info( 'invoice', 'I-' + invoice.name + '[' + req.params.invoice_id + '] changed to status 4 (cancelled/deleted)', {
                                    req: req,
                                    model: 'invoice',
                                    model_id: invoice.id
                                } );

                                return next();
                            }
                        } );
                    }
                    else{
                        res.send( 400, { errors: [ 'Cannot delete invoice.' ] } );
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
    req.assert( 'invoice_id', 'isString' );

    if( !_.isEmpty( req.validationErrors ) ){
        util.handleValidationErrors( req, res );
        return next();
    }
    else{
        Invoice.find( {
            where: {
                id: req.params.invoice_id
            },
            include: [
                { model: InvoiceItem },
                { model: Currency },
                {
                    model: Company,
                    attributes: [ 'id', 'name', 'account_number', 'address', 'city', 'state_province', 'postal_code', 'phone', 'email' ]
                },
                {
                    model: Company,
                    as: 'toCompany',
                    attributes: [ 'id', 'name', 'account_number', 'address', 'city', 'state_province', 'postal_code', 'phone', 'email' ]
                },
                {
                    model: Node,
                    include: {
                        model: Fund
                    }
                }
            ]
        } ).done( function( err, invoice ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !invoice ){
                res.send( 404 );
                return next();
            }
            else if( invoice.company_id === req.user.company_id || invoice.to_company_id === req.user.company_id || ( !_.isEmpty( invoice.node ) && !_.isEmpty( invoice.node.fund ) && invoice.node.fund.investor_id === req.user.company_id ) ){
                var invoice_items = [];
                _.forEach( invoice.invoiceItems, function( item ){
                    var newItem = {
                        name: item.name,
                        unit: item.unit,
                        price: invoice.currency.symbol + Globalize.format( item.price, 'n5' ),
                        quantity: item.quantity,
                        subtotal: invoice.currency.symbol + Globalize.format( item.price * item.quantity, 'n2' )
                    };

                    invoice_items.push( newItem );
                } );

                var invoice_tax = math.round( invoice.amount * invoice.tax_rate / 100, 2 );
                var invoice_total = invoice.amount + invoice_tax;

                invoice.values.invoice_items = invoice_items;
                invoice.values.invoice_tax = invoice.currency.symbol + Globalize.format( invoice_tax, 'n2' );
                invoice.values.invoice_total = invoice.currency.symbol + Globalize.format( invoice_total, 'n2' );
                invoice.values.invoice_subtotal = invoice.currency.symbol + Globalize.format( invoice.amount, 'n2' );
                invoice.values.is_external = invoice.type === 2;
                invoice.values.is_usd = invoice.currency_id === 'USD';
                invoice.values.is_eur = invoice.currency_id === 'EUR';
                invoice.values.is_gbp = invoice.currency_id === 'GBP';

                if( !_.isEmpty( invoice.toCompany ) ){
                    invoice.values.to_company_account_number = invoice.toCompany.account_number;
                    invoice.values.to_company_name = invoice.toCompany.name;
                    invoice.values.to_company_email = invoice.toCompany.email;
                    invoice.values.to_company_phone = invoice.toCompany.phone;
                    invoice.values.to_company_address = invoice.toCompany.address;
                    invoice.values.to_company_city = invoice.toCompany.city;
                    invoice.values.to_company_state_province = invoice.toCompany.state_province;
                    invoice.values.to_company_postal_code = invoice.toCompany.postal_code;
                    invoice.values.to_company_country = invoice.toCompany.country;
                }

                request.post( {
                    url: pdfConfig.host + '/pdfs',
                    json: {
                        template_name: 'invoice',
                        data: {
                            invoice: invoice,
                            options: {
                                //headerRight: "Page [page] of [toPage]"
                            }
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
                            var fileName = 'I-' + invoice.name + '.pdf';

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
            else{
                res.send( 404 );
                return next();
            }
        } );
    }
};