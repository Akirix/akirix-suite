module.exports = function( server, passport ){
    // emails
    var emails = require( '../controllers/emails' );
    server.post( '/emails', emails.create );
    server.get( '/emails/html', emails.viewHtml );
    server.get( '/emails/mandrill', emails.getMandrillTemplates );

    var slack = require( '../controllers/slack' );
    server.post( '/slack', slack.create );

    var utilities = require( '../controllers/utilities' );
    server.get( '/info/status', utilities.status );
};
