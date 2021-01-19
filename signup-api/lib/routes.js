module.exports = function( server, passport, db ){
    var tokens = require( '../controllers/tokens' );
    var winston = require( 'winston' );
    var logger = winston.loggers.get( 'logger' );

    var authACL = [
        passport.authenticate( 'bearer', { session: false } ),
    ];

    var authACLParams = [
        tokens.validateParam
    ];

    // utilities controller
    var utilities = require( '../controllers/utilities' );
    server.get( '/info/status', utilities.status );

    // Auth
    server.post( '/tokens', tokens.login );
    server.post( '/logout', authACL, tokens.logout );
    server.post( '/tokens/renew', authACL, tokens.renew );

    /* Users */
    var users = require( '../controllers/users' );
    server.post( '/users', users.create );

    server.get( '/users/:user_id/registration', authACL, users.getRegistration );
    server.put( '/users/:user_id/update-password', authACL, users.updatePassword );

    /* Password Recovery */
    var passwordRecoveries = require( '../controllers/password-recoveries' );
    server.post( '/password-recoveries/password-reset', passwordRecoveries.updatePassword );
    server.post( '/password-recoveries', passwordRecoveries.create );
    server.get( '/password-recoveries/:token', passwordRecoveries.validate );

    // Invitations
    var invitations = require( '../controllers/invitations' );
    //server.post( '/invitations', authACL, invitations.create );
    //server.post( '/invitations/complete', invitations.complete );

    // Registrations
    var registrations = require( '../controllers/registrations' );
    server.put( '/registrations/:registration_id', authACL, registrations.update );
    server.put( '/registrations/:registration_id/agreement', authACL, registrations.agreement );
    server.put( '/registrations/:registration_id/complete', authACL, registrations.complete );
    server.put( '/registrations/:registration_id/inquiries', authACL, registrations.inquiries );
    server.put( '/registrations/:registration_id/appSteps', authACL, registrations.appSteps );

    // Registration Documents
    server.post( '/registrations/:registration_id/documents', authACL, registrations.createDocument );
    server.put( '/registrations/:registration_id/documents/:sub_document_id', authACL, registrations.updateDocument );
    server.del( '/registrations/:registration_id/documents/:sub_document_id', authACL, registrations.removeDocument );

    // Documents
    var documents = require( '../controllers/documents' );
    server.post( '/documents', authACL, documents.create );
    server.get( '/documents/:document_id', authACL, documents.view );
    server.get( '/documents/:document_id/stream', authACLParams, documents.stream );
    server.get( '/documents/:document_id/download', authACLParams, documents.download );

    // Verifications
    var verifications = require( '../controllers/verifications' );
    server.get( '/verifications/verified', verifications.verified );
    server.post( '/verifications/verify', verifications.verify );

    // Inquiries
    var inquiries = require( '../controllers/inquiries' );
    server.get( '/inquiries', authACL, inquiries.get );

    // DocumentTypes
    var documentTypes = require( '../controllers/document-types' );
    server.get( '/document-types', authACL, documentTypes.get );

    // Agreements
    var agreements = require( '../controllers/agreements' );
    server.get( '/agreements/latest', authACL, agreements.get );
};