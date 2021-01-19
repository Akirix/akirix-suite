module.exports = function( server, passport ){
    var config = require( '../config/config.json' );
    var redis = require( 'redis' );
    var redisClient = redis.createClient( config.redis );
    /* Auth + ACL */
    var akxMq = require( './akx.mq' );
    var tokens = require( '../controllers/tokens' );
    var locks = require( '../controllers/locks' );
    var accessLogs = require( '../controllers/access_logs' );
    var info_requests = require( '../controllers/info_requests' );
    var rate = new (require( './ratelimit' ))( redisClient );
    var dupCheck = require( 'node-duplicate-req' )( redisClient, { prefix: 'dup-check-', logPath: __dirname + '/../log' } );
    var dupMiddleware = dupCheck.middleware();


    var authACL = [
        //rate.limitMid,
        passport.authenticate( 'bearer', { session: false } ),
        tokens.getIpCheckFX(),
        tokens.acl,
        accessLogs.addEntry,
        locks.check
    ];

    var authACLParams = [
        //rate.limitMid,
        tokens.validateParam,
        tokens.getIpCheckFX(),
        tokens.acl,
        accessLogs.addEntry,
        locks.check
    ];

    var authACLTwoFactor = [
        //rate.limitMid,
        passport.authenticate( 'bearer', { session: false } ),
        tokens.getIpCheckFX(),
        tokens.acl,
        accessLogs.addEntry,
        locks.check,
        tokens.twoFactorOk,
        info_requests.checkInfoRequest
    ];

    var authACLInfoReq = [
        //rate.limitMid,
        passport.authenticate( 'bearer', { session: false } ),
        tokens.getIpCheckFX(),
        tokens.acl,
        accessLogs.addEntry,
        locks.check,
        info_requests.checkInfoRequest
    ];

    /* Routes */
    // utilities
    var utilities = require( '../controllers/utilities' );
    server.get( '/info/status', utilities.status );
    server.get( '/info/now', utilities.now );
    server.get( '/info/permissions', utilities.permissions );
    server.post( '/utilities/sendInvite', authACLInfoReq, utilities.sendInvite );

    // tokens
    server.post( '/tokens', rate.limitLow, tokens.login );
    server.del( '/tokens', authACL, tokens.logout );
    server.post( '/tokens/renew', authACL, tokens.refresh );
    server.get( '/tokens/two_factor', authACL, tokens.twoFactorStatus );
    server.post( 'tokens/revoke', authACL, tokens.revoke );

    // announcements
    var announcements = require( '../controllers/announcements' );
    server.get( '/announcements', announcements.index );

    // currencies
    var currencies = require( '../controllers/currencies' );
    server.get( '/currencies', currencies.index );
    server.get( '/currencies/:currency_id', currencies.view );

    // foreign exchange
    var fx_requests = require( '../controllers/fx_requests' );
    server.get( '/fxRequests', authACL, fx_requests.index );
    //server.get( '/fxRequests/rates', authACL, fx_requests.getRates );
    server.get( '/fxRequests/:fx_request_id', authACL, fx_requests.view );
    //server.post( '/fxRequests', authACL, dupMiddleware, fx_requests.create );

    // accounts
    var accounts = require( '../controllers/accounts' );
    server.post( '/accounts/:account_id/transfer', authACLInfoReq, dupMiddleware, accounts.transfer );
    server.put( '/accounts/:account_id', authACLInfoReq, accounts.update );
    server.get( '/accounts', authACL, accounts.index );
    server.get( '/accounts/:account_id', authACL, accounts.view );
    server.get( '/accounts/:account_id/download', authACLParams, accounts.download );

    //Charge
    var charges = require( '../controllers/charges' );
    server.get( '/charges', authACL, charges.index );
    server.get( '/charges/:charge_id', authACL, charges.view );

    // account_aliases
    var account_aliases = require( '../controllers/account_aliases' );
    server.get( '/accountAliases', authACL, account_aliases.index );

    // users
    var users = require( '../controllers/users' );
    //server.post( '/users', users.create );
    server.get( '/users/:user_id', authACL, users.view );
    server.put( '/users/:user_id', authACLInfoReq, users.update );
    server.post( '/users/forgot', users.forgot );
    server.post( '/users/password_reset', users.passwordReset );

    // user_settings
    var userSettings = require( '../controllers/user_settings' );
    server.get( '/userSettings', authACL, userSettings.index );
    server.get( '/userSettings/:user_setting_id', authACL, userSettings.view );
    server.put( '/userSettings/:user_setting_id', authACLInfoReq, userSettings.update );

    // companies
    var companies = require( '../controllers/companies' );
    server.get( '/companies', authACL, companies.index );
    server.get( '/companies/:company_id', authACL, companies.view );
    server.put( '/companies/:company_id', authACLInfoReq, companies.update );

    // investors
    var investors = require( '../controllers/investors' );
    server.get( '/investors/:company_id', authACL, investors.view );

    // projects
    var projects = require( '../controllers/projects' );
    server.post( '/projects', authACLInfoReq, dupMiddleware, projects.create );
    server.get( '/projects', authACL, projects.index );
    server.get( '/projects/:project_id', authACL, projects.view );
    server.post( '/projects/:project_id/add_buyer', authACLInfoReq, dupMiddleware, projects.addBuyer );
    server.post( '/projects/:project_id/add_supplier', authACLInfoReq, dupMiddleware, projects.addSupplier );

    // commissions
    var commissions = require( '../controllers/commissions' );
    server.get( '/commissions', authACL, commissions.index );
    server.get( '/commissions/:commission_id', authACL, commissions.view );

    // commission_payments
    var commission_payments = require( '../controllers/commission_payments' );
    server.get( '/commissionPayments', authACL, commission_payments.index );
    server.get( '/commissionPayments/:commission_payment_id', authACL, commission_payments.view );

    // commission_payment_items
    var commission_payment_items = require( '../controllers/commission_payment_items' );
    server.get( '/commissionPaymentItems', authACL, commission_payment_items.index );
    server.get( '/commissionPaymentItems/:commission_payment_item_id', authACL, commission_payment_items.view );

    // nodes
    var nodes = require( '../controllers/nodes' );
    server.post( '/nodes', authACLInfoReq, dupMiddleware, nodes.create );
    server.get( '/nodes', authACL, nodes.index );
    server.get( '/nodes/:node_id', authACL, nodes.view );
    server.get( '/nodes/:node_id/can_invoice', authACL, nodes.canInvoice );
    server.post( '/nodes/:node_id/point_funds', authACLInfoReq, dupMiddleware, nodes.pointFunds );
    server.post( '/nodes/:node_id/return_funds', authACLInfoReq, dupMiddleware, nodes.returnFunds );
    server.put( '/nodes/:node_id', authACLInfoReq, nodes.update );
    server.post( '/nodes/:node_id/accept', authACLInfoReq, nodes.accept );
    server.post( '/nodes/:node_id/decline', authACLInfoReq, nodes.decline );
    server.post( '/nodes/:node_id/activate', authACLInfoReq, nodes.activateSmartNode );

    var external_nodes = require( '../controllers/external_nodes' );
    server.post( '/externalNodes', authACLInfoReq, dupMiddleware, external_nodes.create );
    server.get( '/externalNodes', authACL, external_nodes.index );
    server.get( '/externalNodes/:external_node_id', authACL, external_nodes.view );

    // node_items
    var node_items = require( '../controllers/node_items' );
    server.get( '/nodeItems', authACL, node_items.index );
    server.post( '/nodeItems', authACLInfoReq, node_items.create );
    server.get( '/nodeItems/:node_item_id', authACL, node_items.view );
    server.put( '/nodeItems/:node_item_id', authACLInfoReq, node_items.update );

    // invoices
    var invoices = require( '../controllers/invoices' );
    server.post( '/invoices', authACLInfoReq, dupMiddleware, invoices.create );
    server.get( '/invoices', authACL, invoices.index );
    server.get( '/invoices/:invoice_id', authACL, invoices.view );
    server.get( '/invoices/external/:invoice_id', [], invoices.external );
    server.get( '/invoices/:invoice_id/can_create_child', authACL, invoices.canCreateChild );
    server.put( '/invoices/:invoice_id', authACLInfoReq, invoices.update );
    server.del( '/invoices/:invoice_id', authACLInfoReq, invoices.delete );
    server.post( '/invoices/:invoice_id/activate', authACLInfoReq, invoices.activate );
    server.post( '/invoices/:invoice_id/recall', authACLInfoReq, invoices.recall );
    server.post( '/invoices/:invoice_id/markPaid', authACLInfoReq, invoices.markPaid );
    server.post( '/invoices/:invoice_id/pay', authACLInfoReq, dupMiddleware, invoices.pay );
    server.get( '/invoices/:invoice_id/pdf', authACLParams, invoices.getPdf );

    // invoice_items
    var invoice_items = require( '../controllers/invoice_items' );
    server.get( '/invoiceItems', authACL, invoice_items.index );
    server.post( '/invoiceItems', authACL, [ info_requests.checkInfoRequest, invoice_items.create ] );
    server.put( '/invoiceItems/:invoice_item_id', authACLInfoReq, invoice_items.update );
    server.del( '/invoiceItems/:invoice_item_id', authACLInfoReq, invoice_items.delete );

    // transactions
    var transactions = require( '../controllers/transactions' );
    server.get( '/transactions', authACL, transactions.index );

    // wires
    var wires = require( '../controllers/wires' );
    server.post( '/wires', authACLTwoFactor, dupMiddleware, [ wires.create, akxMq.sendWireToQueue ] );
    server.get( '/wires', authACL, wires.index );
    server.post( '/wires/sendInstructions', authACLInfoReq, wires.sendInstructions );
    server.get( '/wires/:wire_id', authACL, wires.view );
    //server.post( '/wires/:wire_id/approve', authACL, wires.approve );
    server.post( '/wires/:wire_id/cancel', authACLInfoReq, wires.cancel );
    server.get( '/wires/:wire_id/pdf', authACLParams, wires.getPdf );

    // wire_templates
    var wire_templates = require( '../controllers/wire_templates' );
    server.post( '/wireTemplates', authACLInfoReq, wire_templates.create );
    server.get( '/wireTemplates', authACL, wire_templates.index );
    server.get( '/wireTemplates/:wire_template_id', authACL, wire_templates.view );
    server.put( '/wireTemplates/:wire_template_id', authACLInfoReq, wire_templates.update );
    server.del( '/wireTemplates/:wire_template_id', authACLInfoReq, wire_templates.delete );

    // documents
    var documents = require( '../controllers/documents' );
    server.get( '/documents', authACL, documents.index );
    server.get( '/documents/:document_id', authACL, documents.view );
    server.get( '/documents/:document_id/download', authACLParams, documents.download );
    server.get( '/documents/:document_id/stream', authACLParams, documents.stream );
    server.post( '/documents', authACL, documents.create );
    server.put( '/documents/:document_id', authACLInfoReq, documents.update );
    server.del( '/documents/:document_id', authACLInfoReq, documents.delete );

    // authenticators
    var authenticators = require( '../controllers/authenticators' );
    server.post( '/authenticators', authACLTwoFactor, authenticators.create );
    server.post( '/authenticators/:authenticator_id/activate', authACLInfoReq, authenticators.activate );
    server.post( '/authenticators/auth', authACLInfoReq, authenticators.authenticate );
    server.post( '/authenticators/sms', authACLInfoReq, authenticators.sms );
    server.get( '/authenticators', authACL, authenticators.index );
    server.get( '/authenticators/qr', authACLParams, authenticators.generateQr );
    server.get( '/authenticators/:authenticator_id', authACL, authenticators.view );
    server.put( '/authenticators/:authenticator_id', authACLTwoFactor, authenticators.update );
    server.del( '/authenticators/:authenticator_id', authACLInfoReq, authenticators.delete );

    // Funds
    var funds = require( '../controllers/funds' );
    server.post( '/funds', authACLInfoReq, funds.create );
    server.get( '/funds', authACL, funds.index );
    server.get( '/funds/:fund_id', authACL, funds.view );
    server.put( '/funds/:fund_id', authACLInfoReq, funds.update );
    server.post( '/funds/:fund_id/add_project', authACLInfoReq, funds.addProject );
    server.post( '/funds/:fund_id/remove_project', authACL, [ info_requests.checkInfoRequest, funds.removeProject ] );
    server.post( '/funds/:fund_id/send', authACLInfoReq, funds.send );
    server.post( '/funds/:fund_id/accept', authACLInfoReq, funds.accept );
    server.post( '/funds/:fund_id/decline', authACLInfoReq, funds.decline );
    server.post( '/funds/:fund_id/withdraw', authACLInfoReq, funds.withdraw );

    // Amendments
    var amendments = require( '../controllers/amendments' );
    server.post( '/amendments', authACLInfoReq, amendments.create );
    server.get( '/amendments/:amendment_id', authACL, amendments.view );
    server.put( '/amendments/:amendment_id', authACLInfoReq, amendments.update );

    // Statements
    var statements = require( '../controllers/statements' );
    server.get( '/statements', authACL, statements.index );
    server.get( '/statements/:statement_id/download', authACLParams, statements.download );

    //dashboard status
    var stats = require( '../controllers/stats' );
    server.get( '/stats/:type', authACL, stats.action );

    // Tickets
    var tickets = require( '../controllers/tickets' );
    server.get( '/tickets', authACL, tickets.index );
    server.post( '/tickets', authACL, tickets.create );
    server.get( '/tickets/:ticket_id', authACL, tickets.view );
    server.post( '/tickets/:ticket_id/close', authACL, tickets.close );
    server.post( '/tickets/:ticket_id/open', authACL, tickets.open );

    // TicketMessages
    var ticket_messages = require( '../controllers/ticket_messages' );
    server.get( '/ticketMessages', authACL, ticket_messages.index );
    server.post( '/ticketMessages', authACL, ticket_messages.create );

    // Fee
    var fees = require( '../controllers/fees' );
    server.get( '/fees', authACL, fees.index );

    server.get( '/infoRequests', authACL, info_requests.index );
    server.get( '/infoRequests/:info_request_id', authACL, info_requests.view );
    server.put( '/infoRequests/:info_request_id', authACL, info_requests.update );

    var locations = require( '../controllers/locations' );
    server.get( '/locations', locations.index );

    var banks = require( '../controllers/banks' );
    server.get( '/banks', authACL, banks.index );

    var wire_instructions = require( '../controllers/wire_instructions' );
    server.get( '/wireInstructions', authACL, wire_instructions.index );

};
