
var sequelize = require( 'sequelize' );
var db = require( '../models' );
var _ = require( 'lodash' );

var Ticket = db.Ticket;
var Company = db.Company;
var TicketMessage = db.TicketMessage;

var notifier = require( '../lib/akx.notifier.js' );
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;



exports.handleError = function( err, req, res ){
    util.handleError( 'ticket', err, req, res );
};



exports.index = function( req, res, next ){

    req.assert( 'ticket_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        TicketMessage.findAll( {
            where: {
                ticket_id: req.params.ticket_id
            },
            order: [
                [ 'created_at', 'ASC' ]
            ]
        } ).done( function( err, ticketMessages ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !ticketMessages ){
                res.send( 200, { ticketMessages: [] } );
                return next();
            }
            else{
                res.send( 200, { ticketMessages: ticketMessages } );
                return next();
            }
        } )
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.view = function( req, res, next ){

    req.assert( 'ticket_message_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        TicketMessage.find( {
            where: {
                id: req.params.ticket_message_id
            }
        } ).done( function( err, ticketMessage ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !ticketMessage ){
                res.send( 404 );
                return next();
            }
            else{
                res.send( 200, { ticketMessage: ticketMessage } );
                return next();
            }
        } )
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};



// Note to self: add ability to not send uber user name
exports.create = function( req, res, next ){

    req.assert( 'ticketMessage', 'isObject' );
    req.assert( 'ticketMessage.ticket_id', 'isString' );
    req.assert( 'ticketMessage.notes', 'isText' );

    if( _.isEmpty( req.validationErrors ) ){

        Ticket.find( {
            where: {
                id: req.body.ticketMessage.ticket_id
            }
        } ).done( function( err, ticket ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( _.isEmpty( ticket ) ){
                res.send( 400, { errors: [ 'Need a valid ticket_id' ] } );
                return next();
            }
            else{
                var newTicketMessage = TicketMessage.build( {
                    uber_user_id: req.user.id,
                    notes: req.body.ticketMessage.notes,
                    ticket_id: req.body.ticketMessage.ticket_id
                } );
                newTicketMessage.save().done( function( err ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else{
                        newTicketMessage.values.ticket_id = newTicketMessage.ticket_id;
                        newTicketMessage.values.uber_user_id = req.user.id;

                        res.send( 201, { ticket_message: newTicketMessage } );
                        //send email to company when message received from Admin
                        notifier.notifyCompany( 'akx-ticket-msg-received', ticket.company_id, { ticket_name: ticket.name }, req );
                        return next();
                    }
                } );
            }
        } )
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};