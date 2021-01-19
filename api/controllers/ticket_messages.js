

var Sequelize = require( 'sequelize' );
var moment = require( 'moment-timezone' );
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
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};




exports.create = function( req, res, next ){
    req.assert( 'ticketMessage', 'isObject' );
    req.assert( 'ticketMessage.ticket_id', 'isString' );

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
                res.send( 400, { errors: [ 'Invalid ticket_id' ] } );
                return next();
            }
            else{
                var newTicketMessage = TicketMessage.build( {
                    ticket_id: req.body.ticketMessage.ticket_id,
                    notes: req.body.ticketMessage.notes,
                    user_id: req.user.id
                } );
                newTicketMessage.save().done( function( err ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else{
                        res.send( 201, { ticket_message: newTicketMessage } );
                        logger.info( 'ticket', 'Ticket message has been created for [' + ticket.id + ']', {
                            req: req,
                            model: 'ticket-message',
                            model_id: newTicketMessage.id
                        } );
                        return next();
                    }
                } );
            }
        } )
    }
};
