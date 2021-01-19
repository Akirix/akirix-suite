module.exports = function( server, passport ){
    var config = require( '../config/config.json' );
    var redis = require( 'redis' );
    var redisClient = redis.createClient( config.redis );
    /* Auth + ACL */
    var tokens = require( '../controllers/uber_tokens' );
    var rate = new ( require( './ratelimit' ) )( redisClient );
    require( '../models_redis/UberUserCache' ).setClient( redisClient );
    var util = require( './akx.util.js' );
    var transports = require( '../config/config.json' ).akxLogger.transports;
    var currentFileName = __filename.split( '/' ).pop();
    var akxLogger = require( 'logger' )( currentFileName, transports );
    var dupCheckLogger = require( 'logger' )( 'node-duplicate-req', transports );
    var dupCheck = require( 'node-duplicate-req' )( redisClient, {
        prefix: 'dup-check-',
        infoLogFunc: function( req ){
            return dupCheckLogger.info( "Duplicate request found", req );
        },
        errorLogFunc: function( err, req ){
            return dupCheckLogger.error( err, req );
        },
        ovrLogFunc: function( req ){
            return dupCheckLogger.info( "Duplicate Check Overridden", req );
        }
    } );
    var uber_users = require( '../controllers/uber_users' );
    var dupCheckMid = dupCheck.middleware();
    var akxMqInstance = new ( require( './akxMq' ) );

    var midAuthPassport = [ passport.authenticate( 'bearer', { session: false } ) ];
    var midAuthParam = [ tokens.validateParam ];
    var midAuth2FA = [ tokens.twoFactorOk ];
    var midSecurity = [
        tokens.ipCheck,
        tokens.acl,
        uber_users.checkPasswordExpiration
    ];

    var midGrpDefault = [].concat.apply( [], [ midAuthPassport, midSecurity ] );
    var midGrpParam = [].concat.apply( [], [ midAuthParam, midSecurity ] );
    var midGrp2FA = midGrpDefault.concat( midAuth2FA );

    var auditLog = function( req, res, next ){
        var logMsg = req.method + ' ' + req.url;
        var records = [];
        var data = {};
        // // records.push( { model: 'transaction', model_id: feeTrans.id } );
        // switch ( req.method ){
        //     case 'GET':
        //         break;
        //     case 'POST':
        //         break;
        //     case 'PUT':
        //         break;
        //     default:
        //
        // }
        // console.log(req);
        akxLogger.audit( logMsg, req, records, data );
        return next();
    };
    /* Routes */

    // Get Item Counts for badges
    var utils = require( '../controllers/utility' );
    server.get( '/utilities/itemCounts', midGrpDefault, utils.getCounts );

    /* Uber */
    // uber authenticators
    var authenticators = require( '../controllers/uber_authenticators' );
    server.post( '/uberAuthenticators', midGrp2FA, authenticators.create );
    server.post( '/uberAuthenticators/:uber_authenticator_id/activate', midGrpDefault, authenticators.activate );
    server.post( '/uberAuthenticators/auth', midGrpDefault, authenticators.authenticate );
    server.post( '/uberAuthenticators/sms', midGrpDefault, authenticators.sms );
    server.get( '/uberAuthenticators', midGrpDefault, authenticators.index );
    server.get( '/uberAuthenticators/voxloc', authenticators.voxloc );
    server.get( '/uberAuthenticators/qr', midGrpParam, authenticators.generateQr );
    server.get( '/uberAuthenticators/:uber_authenticator_id', midGrpDefault, authenticators.view );
    server.del( '/uberAuthenticators/:uber_authenticator_id', midGrpDefault, authenticators.delete );

    //uberExceptions
    var uber_exceptions = require( '../controllers/uber_exceptions' );
    server.get( '/uberExceptions', midGrpDefault, uber_exceptions.index );
    server.post( '/uberExceptions/:uber_exception_id/accept', midGrpDefault, uber_exceptions.accept, auditLog );
    server.post( '/uberExceptions/:uber_exception_id/reject', midGrpDefault, uber_exceptions.reject, auditLog );

    // uber-documents
    var uber_documents = require( '../controllers/uber_documents' );
    server.get( '/uberDocuments', midGrpDefault, uber_documents.index );
    server.post( '/uberDocuments', midGrpDefault, uber_documents.create, auditLog );
    server.get( '/uberDocuments/:uber_document_id', midGrpDefault, uber_documents.view );
    server.get( '/uberDocuments/:uber_document_id/download', midGrpParam, uber_documents.download );
    server.get( '/uberDocuments/:uber_document_id/stream', midGrpParam, uber_documents.stream );
    server.put( '/uberDocuments/:uber_document_id', midGrpDefault, uber_documents.update );
    server.del( '/uberDocuments/:uber_document_id', midGrpDefault, uber_documents.delete, auditLog );

    // uber-tokens
    server.post( '/uberTokens', rate.limitLow, tokens.login );
    server.del( '/uberTokens', midGrpDefault, tokens.logout );
    server.post( '/uberTokens/renew', midGrpDefault, tokens.refresh );
    server.get( '/uberTokens/two_factor', midGrpDefault, tokens.twoFactorStatus );
    server.get( '/uberTokens/toth', midGrpDefault, tokens.toth );
    server.post( '/uberTokens/revoke', midGrpDefault, tokens.revoke );

    // uber-users
    server.get( '/uberUsers', midGrpDefault, uber_users.index );
    server.get( '/uberUsers/:uber_user_id', midGrpDefault, uber_users.view );
    server.put( '/uberUsers/password_update', midGrpDefault.slice( 0, midGrpDefault.length - 1 ), uber_users.updatePassword );
    server.put( '/uberUsers/:uber_user_id', midGrpDefault, uber_users.update );
    server.post( '/uberUsers/forgot', uber_users.forgot );
    server.post( '/uberUsers/password_reset', uber_users.passwordReset );

    // uber-tasks
    var uber_tasks = require( '../controllers/uber_tasks' );
    server.get( '/uberTasks', midGrpDefault, uber_tasks.index );
    server.get( '/uberTasks/:uber_task_id', midGrpDefault, uber_tasks.view );
    server.post( '/uberTasks', midGrpDefault, uber_tasks.create, auditLog );
    server.put( '/uberTasks/:uber_task_id', midGrpDefault, uber_tasks.update, auditLog );

    // uber-company-settings
    var uber_company_settings = require( '../controllers/uber_company_settings' );
    server.get( '/uberCompanySettings', midGrpDefault, uber_company_settings.index );

    //uber-due-diligence
    var uber_due_diligence = require( '../controllers/uber_due_diligence' );
    server.post( '/uberDueDiligences', midGrpDefault, uber_due_diligence.create, auditLog );
    server.get( '/uberDueDiligences', midGrpDefault, uber_due_diligence.index );
    server.get( '/uberDueDiligences/:uber_due_diligence_id', midGrpDefault, uber_due_diligence.view );
    server.get( '/uberDueDiligences/:uber_due_diligence_id/download', midGrpParam, uber_due_diligence.download, auditLog );

    // uber-user-cache
    var uber_user_caches = require( '../controllers/uber_user_caches' );
    server.get( '/uberUserCaches/:uber_user_id', midGrpDefault, uber_user_caches.view );
    server.put( '/uberUserCaches/:uber_user_id', midGrpDefault, uber_user_caches.update );

    //uber-mon-rules
    var uber_mon_rules = require( '../controllers/uber_mon_rules' );
    server.get( '/uberMonRules', midGrpDefault, uber_mon_rules.index );
    server.post( '/uberMonRules', midGrpDefault, uber_mon_rules.create, auditLog );
    server.get( '/uberMonRules/:uber_mon_rule_id', midGrpDefault, uber_mon_rules.view );
    server.put( '/uberMonRules/:uber_mon_rule_id', midGrpDefault, uber_mon_rules.update, auditLog );
    server.post( '/uberMonRules/:uber_mon_rule_id/activate', midGrpDefault, uber_mon_rules.activate, auditLog );
    server.post( '/uberMonRules/:uber_mon_rule_id/deactivate', midGrpDefault, uber_mon_rules.deactivate, auditLog )

    /* Platform */

    // bank routes
    var bank_routes = require( '../controllers/bank_routes' );
    server.get( '/bankRoutes', midGrpDefault, bank_routes.index );
    server.get( '/bankRoutes/:bank_route_id', midGrpDefault, bank_routes.view );

    var security_questions = require( '../controllers/security_questions' );
    server.get( '/securityQuestions', midGrpDefault, security_questions.index );
    server.get( '/securityQuestions/:security_question_id', midGrpDefault, security_questions.view );
    server.post( '/securityQuestions', midGrpDefault, security_questions.create );
    server.del( '/securityQuestions/:security_question_id', midGrpDefault, security_questions.delete );

    // currencies
    var currencies = require( '../controllers/currencies' );
    server.get( '/currencies', currencies.index );
    server.get( '/currencies/:currency_id', currencies.view );


    // foreign exchange
    var fx_requests = require( '../controllers/fx_requests' );
    server.get( '/fxRequests', midGrpDefault, fx_requests.index );
    server.get( '/fxRequests/rates', midGrpDefault, fx_requests.getRates );
    server.get( '/fxRequests/search', midGrpDefault, fx_requests.search );
    server.get( '/fxRequests/:fx_request_id', midGrpDefault, fx_requests.view );
    server.post( '/fxRequests', midGrp2FA, dupCheckMid, fx_requests.create, auditLog );
    server.post( '/fxRequests/:fx_request_id/cancel', midGrp2FA, fx_requests.cancel );
    server.post( '/fxRequests/:fx_request_id/start', midGrp2FA, fx_requests.start, auditLog );
    server.post( '/fxRequests/:fx_request_id/complete', midGrp2FA, dupCheckMid, fx_requests.complete, auditLog );

    // users
    var users = require( '../controllers/users' );
    server.get( '/users', midGrpDefault, users.index );
    server.post( '/users', midGrpDefault, users.create, auditLog );
    server.get( '/users/search', midGrpDefault, users.search );
    server.get( '/users/:user_id', midGrpDefault, users.view );
    server.put( '/users/:user_id', midGrpDefault, users.update, auditLog );
    server.post( '/users/:user_id/password_reset', midGrpDefault, users.passwordReset, auditLog );
    server.post( '/users/:user_id/impersonate', midGrpDefault, users.impersonate, auditLog );

    //verifications
    var verifications = require( '../controllers/verifications' );
    server.get( '/verifications', midGrpDefault, verifications.index );
    server.post( '/verifications', midGrpDefault, verifications.add );

    var company_wire_instructions = require( '../controllers/company_wire_instructions' );
    server.get( '/companyWireInstructions', midGrpDefault, company_wire_instructions.index );
    server.post( '/companyWireInstructions', midGrpDefault, company_wire_instructions.add, auditLog );
    server.del( '/companyWireInstructions/:company_wire_instruction_id', midGrpDefault, company_wire_instructions.delete );

    // projects
    var projects = require( '../controllers/projects' );
    //server.post( '/projects', midGrpDefault, projects.create );
    server.get( '/projects', midGrpDefault, projects.index );
    server.get( '/projects/:project_id', midGrpDefault, projects.view );
    server.post( '/projects/:project_id/activate', midGrpDefault, projects.activateSmartProject, auditLog );
    //server.post( '/projects/:project_id/add_supplier', midGrpDefault, projects.addSupplier );

    // commissions
    var commissions = require( '../controllers/commissions' );
    server.get( '/commissions', midGrpDefault, commissions.index );
    server.get( '/commissions/:commission_id', midGrpDefault, commissions.view );
    server.post( '/commissions', midGrp2FA, dupCheckMid, commissions.create, auditLog );
    server.put( '/commissions/:commission_id', midGrp2FA, commissions.update, auditLog );

    // commission_payments
    var commission_payments = require( '../controllers/commission_payments' );
    server.get( '/commissionPayments', midGrpDefault, commission_payments.index );
    server.get( '/commissionPayments/:commission_payment_id', midGrpDefault, commission_payments.view );
    server.post( '/commissionPayments/:commission_payment_id/approve', midGrp2FA, commission_payments.approve, auditLog );
    server.post( '/commissionPayments/:commission_payment_id/deny', midGrp2FA, commission_payments.deny, auditLog );

    // commission_payment_items
    var commission_payment_items = require( '../controllers/commission_payment_items' );
    server.get( '/commissionPaymentItems', midGrpDefault, commission_payment_items.index );
    server.get( '/commissionPaymentItems/:commission_payment_item_id', midGrpDefault, commission_payment_items.view );

    // company_relationship
    var company_relationships = require( '../controllers/company_relationships' );
    server.get( '/companyRelationships', midGrpDefault, company_relationships.index );
    server.get( '/companyRelationships/:company_relationship_id', midGrpDefault, company_relationships.view );
    server.post( '/companyRelationships', midGrpDefault, company_relationships.add );
    server.del( '/companyRelationships/:company_relationship_id', midGrpDefault, company_relationships.delete );

    // nodes
    var nodes = require( '../controllers/nodes' );
    //server.post( '/nodes', midGrpDefault, nodes.create );
    server.get( '/nodes', midGrpDefault, nodes.index );
    server.get( '/nodes/:node_id', midGrpDefault, nodes.view );
    //server.get( '/nodes/:node_id/can_invoice', midGrpDefault, nodes.canInvoice );
    //server.post( '/nodes/:node_id/point_funds', midGrpDefault, nodes.pointFunds );
    //server.post( '/nodes/:node_id/return_funds', midGrpDefault, nodes.returnFunds );
    //server.put( '/nodes/:node_id', midGrpDefault, nodes.update );
    //server.post( '/nodes/:node_id/accept', midGrpDefault, nodes.accept );
    //server.post( '/nodes/:node_id/decline', midGrpDefault, nodes.decline );

    var external_nodes = require( '../controllers/external_nodes' );
    server.post( '/externalNodes', midGrpDefault, external_nodes.create, auditLog );
    server.get( '/externalNodes', midGrpDefault, external_nodes.index );
    server.get( '/externalNodes/:external_node_id', midGrpDefault, external_nodes.view );

    // node_items
    var node_items = require( '../controllers/node_items' );
    server.get( '/nodeItems', midGrpDefault, node_items.index );
    server.post( '/nodeItems', midGrpDefault, node_items.create );
    server.get( '/nodeItems/:node_item_id', midGrpDefault, node_items.view );
    server.put( '/nodeItems/:node_item_id', midGrpDefault, node_items.update );

    // invoices
    var invoices = require( '../controllers/invoices' );
    server.post( '/invoices', midGrpDefault, invoices.create, auditLog );
    server.get( '/invoices', midGrpDefault, invoices.index );
    server.get( '/invoices/:invoice_id', midGrpDefault, invoices.view );
    server.get( '/invoices/external/:invoice_id', [], invoices.external );
    server.get( '/invoices/:invoice_id/can_create_child', midGrpDefault, invoices.canCreateChild );
    server.put( '/invoices/:invoice_id', midGrpDefault, invoices.update, auditLog );
    server.del( '/invoices/:invoice_id', midGrpDefault, invoices.delete, auditLog );
    server.post( '/invoices/:invoice_id/activate', midGrpDefault, invoices.activate, auditLog );
    server.post( '/invoices/:invoice_id/recall', midGrpDefault, invoices.recall, auditLog );
    server.post( '/invoices/:invoice_id/markPaid', midGrpDefault, invoices.markPaid, auditLog );
    server.post( '/invoices/:invoice_id/pay', midGrpDefault, invoices.pay, auditLog );
    server.get( '/invoices/:invoice_id/pdf', midGrpParam, invoices.getPdf );

    // invoice_items
    var invoice_items = require( '../controllers/invoice_items' );
    server.get( '/invoiceItems', midGrpDefault, invoice_items.index );
    server.post( '/invoiceItems', midGrpDefault, invoice_items.create );
    server.put( '/invoiceItems/:invoice_item_id', midGrpDefault, invoice_items.update );
    server.del( '/invoiceItems/:invoice_item_id', midGrpDefault, invoice_items.delete );

    // documents
    var documents = require( '../controllers/documents' );
    server.get( '/documents', midGrpDefault, documents.index );
    server.get( '/documents/:document_id', midGrpDefault, documents.view );
    server.get( '/documents/:document_id/download', midGrpParam, documents.download );
    server.get( '/documents/:document_id/stream', midGrpParam, documents.stream );
    server.post( '/documents', midGrpDefault, documents.create );
    server.put( '/documents/:document_id', midGrpDefault, documents.update );
    server.del( '/documents/:document_id', midGrpDefault, documents.delete );

    // locks
    var locks = require( '../controllers/locks' );
    server.get( '/locks', midGrpDefault, locks.index );
    server.post( '/locks', midGrpDefault, locks.create, auditLog );
    server.del( '/locks/:lock_id', midGrpDefault, locks.delete, auditLog );

    // wires
    var wires = require( '../controllers/wires' );
    server.post( '/wires', midGrp2FA, dupCheckMid, wires.create, akxMqInstance.addWireToQueue, auditLog );
    server.get( '/wires', midGrpDefault, wires.index );
    server.get( '/wires/download', midGrpParam, wires.download, auditLog );
    server.get( '/wires/search', midGrpDefault, wires.search );
    server.get( '/wires/:wire_id', midGrpDefault, wires.view );
    server.put( '/wires/:wire_id', midGrpDefault, wires.update, auditLog );
    server.post( '/wires/:wire_id/complete', midGrp2FA, uber_exceptions.checkExceptions, wires.complete, auditLog );
    server.post( '/wires/:wire_id/cancel', midGrpDefault, wires.cancel, auditLog );
    server.post( '/wires/:wire_id/undo', midGrpDefault, wires.undo, auditLog );
    server.get( '/wires/:wire_id/pdf', midGrpParam, wires.getPdf );
    server.post( '/wires/:wire_id/addToBatch', midGrpDefault, uber_exceptions.checkExceptions, wires.addToBatch, auditLog );
    server.post( '/wires/:wire_id/removeFromBatch', midGrpDefault, wires.removeFromBatch, auditLog );
    server.post( '/wires/:wire_id/reject', midGrpDefault, wires.reject, auditLog );
    server.post( '/wires/:wire_id/achRecall', midGrpDefault, wires.achRecall, auditLog );


    // wire_templates
    var wire_templates = require( '../controllers/wire_templates' );
    server.post( '/wireTemplates', midGrpDefault, wire_templates.create, auditLog );
    server.get( '/wireTemplates', midGrpDefault, wire_templates.index );
    server.put( '/wireTemplates/:wire_template_id', midGrpDefault, wire_templates.update, auditLog );
    server.del( '/wireTemplates/:wire_template_id', midGrpDefault, wire_templates.delete, auditLog );


    // wire_batches
    var wire_batches = require( '../controllers/wire_batches' );
    server.get( '/wireBatches', midGrpDefault, wire_batches.index );
    server.post( '/wireBatches', midGrpDefault, wire_batches.create, auditLog );
    server.get( '/wireBatches/:wire_batch_id', midGrpDefault, wire_batches.view );
    server.get( '/wireBatches/:wire_batch_id/download', midGrpParam, wire_batches.download, auditLog );
    server.put( '/wireBatches/:wire_batch_id', midGrpDefault, wire_batches.update, auditLog );
    server.post( '/wireBatches/:wire_batch_id/setSent', dupCheckMid, midGrp2FA, wire_batches.setSent, auditLog );
    server.post( '/wireBatches/:wire_batch_id/setReceived', midGrpDefault, wire_batches.setReceived, auditLog );
    server.del( '/wireBatches/:wire_batch_id', midGrpDefault, wire_batches.delete, auditLog );

    //wire_instructions
    var wire_instructions = require( '../controllers/wire_instructions' );
    server.get( '/wireInstructions', midGrpDefault, wire_instructions.index );
    server.get( '/wireInstructions/:wire_instruction_id', midGrpDefault, wire_instructions.view );

    // companies
    var companies = require( '../controllers/companies' );
    server.post( '/companies/generateAccountNumber', midGrpDefault, companies.generateAccountNumber, auditLog );
    server.get( '/companies', midGrpDefault, companies.index );
    server.get( '/companies/search', midGrpDefault, companies.search );
    server.get( '/companies/:company_id', midGrpDefault, companies.view );
    server.put( '/companies/:company_id', midGrpDefault, companies.update, auditLog );
    server.post( '/companies/:company_id/activate', midGrpDefault, companies.activate, auditLog );
    server.post( '/companies/:company_id/suspend', midGrpDefault, companies.suspend, auditLog );
    server.post( '/companies/:company_id/close', midGrpDefault, companies.close, auditLog );
    server.post( '/companies/:company_id/duplicateWiresCheck', midGrpDefault, wires.dupCheck );

    // uber email templates
    var uber_email_templates = require( '../controllers/uber_email_templates' );
    server.get( '/uberEmailTemplates', midGrpDefault, uber_email_templates.index );
    server.post( '/uberEmailTemplates', midGrpDefault, uber_email_templates.create );
    server.get( '/uberEmailTemplates/:uber_email_template_id', midGrpDefault, uber_email_templates.view );
    server.put( '/uberEmailTemplates/:uber_email_template_id', midGrpDefault, uber_email_templates.update );
    server.del( '/uberEmailTemplates/:uber_email_template_id', midGrpDefault, uber_email_templates.delete );

    // accounts
    var accounts = require( '../controllers/accounts' );
    server.post( '/accounts', midGrpDefault, dupCheckMid, accounts.create, auditLog );
    server.get( '/accounts/getSweepConfig', midGrpDefault, accounts.getSweepConfig );
    server.get( '/accounts', midGrpDefault, accounts.index, auditLog );
    server.get( '/accounts/:account_id', midGrpDefault, accounts.view, auditLog );
    server.put( '/accounts/:account_id', midGrpDefault, accounts.update, auditLog );
    server.get( '/accounts/:account_id/download', midGrpParam, accounts.download );
    server.post( '/accounts/:account_id/hold', midGrpDefault, accounts.hold, auditLog );
    server.post( '/accounts/:account_id/feeRefund', midGrpDefault, dupCheckMid, accounts.feeRefund, auditLog );
    server.post( '/accounts/:account_id/transfer', midGrpDefault, dupCheckMid, accounts.transfer, auditLog );

    // account_aliases
    var account_aliases = require( '../controllers/account_aliases' );
    //server.post( '/accountAliases', midGrpDefault, account_aliases.create );
    server.post( '/accountAliases', midGrpDefault, account_aliases.create, auditLog );
    server.get( '/accountAliases', midGrpDefault, account_aliases.index );
    server.get( '/accountAliases/search', midGrpDefault, account_aliases.search );
    server.get( '/accountAliases/:account_alias_id', midGrpDefault, account_aliases.view );
    server.del( '/accountAliases/:account_alias_id', midGrpDefault, account_aliases.deactivate, auditLog );

    var account_alias_rules = require( '../controllers/account_alias_rules' );
    server.post( '/accountAliasRules', midGrpDefault, dupCheckMid, account_alias_rules.create, auditLog );
    server.get( '/accountAliasRules', midGrpDefault, account_alias_rules.index );
    server.post( '/accountAliasRules/generateAccountAlias', midGrpDefault, dupCheckMid, account_alias_rules.generateAccountAlias, auditLog );
    server.get( '/accountAliasRules/:account_alias_rule_id', midGrpDefault, account_alias_rules.view );
    server.del( '/accountAliasRules/:account_alias_rule_id', midGrpDefault, account_alias_rules.delete, auditLog );


    // transactions
    var transactions = require( '../controllers/transactions' );
    server.get( '/transactions', midGrpDefault, transactions.index, auditLog );

    //announcements
    var announcements = require( '../controllers/announcements' );
    server.get( '/announcements', midGrpDefault, announcements.index );
    server.get( '/announcements/:announcement_id', midGrpDefault, announcements.view );
    server.post( '/announcements', midGrpDefault, dupCheckMid, announcements.create, auditLog );
    server.put( '/announcements/:announcement_id', midGrpDefault, announcements.update, auditLog );

    //tickets
    var tickets = require( '../controllers/tickets' );
    server.get( '/tickets', midGrpDefault, tickets.index );
    server.post( '/tickets', midGrpDefault, tickets.create, auditLog );
    server.get( '/tickets/:ticket_id', midGrpDefault, tickets.view );
    server.put( '/tickets/:ticket_id', midGrpDefault, tickets.update );
    server.post( '/tickets/:ticket_id/close', midGrpDefault, tickets.close, auditLog );
    server.post( '/tickets/:ticket_id/open', midGrpDefault, tickets.open, auditLog );
    server.post( '/tickets/:ticket_id/tags', midGrpDefault, tickets.createTag );
    server.del( '/tickets/:ticket_id/tags/:tag_id', midGrpDefault, tickets.deleteTag );

    //ticket-messages
    var ticket_messages = require( '../controllers/ticket_messages' );
    server.get( '/ticketMessages', midGrpDefault, ticket_messages.index );
    server.get( '/ticketMessages/:ticket_message_id', midGrpDefault, ticket_messages.view );
    server.post( '/ticketMessages', midGrpDefault, ticket_messages.create, auditLog );

    // uber_tags
    var uber_tags = require( '../controllers/uber_tags' );
    server.get( '/uberTags', midGrpDefault, uber_tags.index );

    //analytics
    var analytics = require( '../controllers/analytics' );
    server.get( '/analytics/pdf', analytics.getPdf );
    server.get( '/analytics/:type', midGrpDefault, analytics.action, auditLog );

    var info_request = require( '../controllers/info_requests' );
    server.get( '/infoRequests', midGrpDefault, info_request.index );
    server.post( '/infoRequests', midGrpDefault, info_request.create, auditLog );
    server.get( '/infoRequests/:info_request_id', midGrpDefault, info_request.view );
    server.put( '/infoRequests/:info_request_id', midGrpDefault, info_request.update, auditLog );
    server.post( '/infoRequests/:info_request_id/open', midGrpDefault, info_request.open, auditLog );
    server.post( '/infoRequests/:info_request_id/close', midGrpDefault, info_request.close, auditLog );

    /* Signup */
    // registrations
    var signup_registrations = require( '../controllers/signup_registrations' );
    server.get( '/signupRegistrations', midGrpDefault, signup_registrations.index );
    server.get( '/signupRegistrations/search', midGrpDefault, signup_registrations.search );
    server.get( '/signupRegistrations/:registration_id', midGrpDefault, signup_registrations.view );
    server.put( '/signupRegistrations/:registration_id', midGrpDefault, signup_registrations.update );
    server.put( '/signupRegistrations/:registration_id/updateStep', midGrpDefault, signup_registrations.updateStep );
    server.put( '/signupRegistrations/:registration_id/updateInquiries', midGrpDefault, signup_registrations.updateInquiries );
    server.post( '/signupRegistrations/:registration_id/createDocument', midGrpDefault, signup_registrations.createDocument );
    server.put( '/signupRegistrations/:registration_id/updateDocument', midGrpDefault, signup_registrations.updateDocument );
    server.del( '/signupRegistrations/:registration_id/removeDocument', midGrpDefault, signup_registrations.removeDocument );
    server.get( '/signupRegistrations/:registration_id/validation', midGrpDefault, signup_registrations.validation );

    server.post( '/signupRegistrations/:registration_id/activate', midGrpDefault, dupCheckMid, uber_exceptions.checkExceptions, signup_registrations.activate );
    server.post( '/signupRegistrations/:registration_id/complete', midGrp2FA, signup_registrations.complete/*, akxMqInstance.wireMiddleware()*/ );
    server.post( '/signupRegistrations/:registration_id/reopen', midGrpDefault, signup_registrations.reopen );
    server.put( '/signupRegistrations/:registration_id/status', midGrpDefault, signup_registrations.status );

    // document-types
    var signup_document_types = require( '../controllers/signup_document_types' );
    server.get( '/signupDocumentTypes', midGrpDefault, signup_document_types.index );

    // documents
    var signup_documents = require( '../controllers/signup_documents' );
    server.get( '/signupDocuments/:document_id', midGrpDefault, signup_documents.view );
    server.get( '/signupDocuments/:document_id/stream', midGrpParam, signup_documents.stream );
    server.get( '/signupDocuments/:document_id/download', midGrpParam, signup_documents.download );
    server.post( '/signupDocuments', midGrpDefault, signup_documents.create, auditLog );

    // emailVerifications
    var signup_verifications = require( '../controllers/signup_verifications' );
    server.post( '/signupVerifications', midGrpDefault, signup_verifications.create );
    server.get( '/signupVerifications', midGrpDefault, signup_verifications.index );

    // tokens
    var signup_tokens = require( '../controllers/signup_tokens' );
    server.post( '/signupTokens', midGrpDefault, signup_tokens.create );


    // proxy
    var proxies = require( '../controllers/proxies' );
    server.post( '/proxies', midGrpDefault, proxies.handleRequest );

    // Statements
    var statements = require( '../controllers/statements' );
    server.get( '/statements', midGrpDefault, statements.index );
    server.get( '/statements/:statement_id/download', midGrpParam, statements.download );

    //Pwned
    var uber_pwned = require( '../controllers/uber_pwned' );
    server.get( '/uberPwneds', midGrpDefault, uber_pwned.index );
    server.get( '/uberPwneds/:uber_pwned_id', uber_pwned.view );

    //access_logs
    var access_logs = require( '../controllers/access_logs' );
    server.get( '/accessLogs', midGrpDefault, access_logs.index );
    server.get( '/accessLogs/:access_log_id', access_logs.view );

    // Charges
    var charges = require( '../controllers/charges' );
    server.get( '/charges', midGrpDefault, charges.index );
    server.get( '/charges/:charge_id', midGrpDefault, charges.view );
    server.post( '/charges', midGrpDefault, charges.create, auditLog );
    //server.put( '/charges/:charge_id', midGrpDefault, charges.update );
    server.del( '/charges/:charge_id', midGrpDefault, charges.delete, auditLog );

    // Fee
    var fees = require( '../controllers/fees' );
    server.get( '/fees', midGrpDefault, fees.index );
    server.put( '/fees/:fee_id', midGrpDefault, fees.update, auditLog );

    var locations = require( '../controllers/locations' );
    server.get( '/locations', locations.index );

    var utilities = require( '../controllers/utilities' );
    server.get( '/info/status', utilities.status );
    server.get( '/info/now', utilities.now );
    server.post( '/info/sendEmail', midGrpDefault, utilities.sendEmail );

    var uber_sar_reports = require( '../controllers/uber_sar_reports' );
    server.get( '/uberSarReports', midGrpDefault, uber_sar_reports.index );
    server.post( '/uberSarReports', midGrpDefault, uber_sar_reports.create );
    server.get( '/uberSarReports/:uber_sar_report_id', midGrpDefault, uber_sar_reports.view );
    server.put( '/uberSarReports/:uber_sar_report_id', midGrpDefault, uber_sar_reports.update );
    server.get( '/uberSarReports/:uber_sar_report_id/pdf', midGrpParam, uber_sar_reports.pdf );
    server.get( '/uberSarReports/:uber_sar_report_id/downloadFinCEN', midGrpParam, uber_sar_reports.downloadFinCEN );
    server.get( '/uberSarReports/:uber_sar_report_id/downloadgoAML', midGrpParam, uber_sar_reports.downloadgoAML );

    var uber_sar_submissions = require( '../controllers/uber_sar_submissions' );
    server.get( 'uberSarSubmissions', midGrpDefault, uber_sar_submissions.index );
    server.post( '/uberSarSubmissions', midGrpDefault, uber_sar_submissions.create );
    server.get( 'uberSarSubmissions/:uber_sar_submission_id', midGrpDefault, uber_sar_submissions.view );
    server.put( 'uberSarSubmissions/:uber_sar_submission_id', midGrpDefault, uber_sar_submissions.update );

    // uber-sar-report-realtions
    var uber_sar_report_relations = require( '../controllers/uber_sar_report_relations' );
    server.get( '/uberSarReportRelations', midGrpDefault, uber_sar_report_relations.index );
};
