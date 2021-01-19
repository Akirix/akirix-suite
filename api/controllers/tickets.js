
var Sequelize = require( 'sequelize' );
var Globalize = require( 'globalize' );
var moment = require( 'moment-timezone' );
var db = require( '../models' );
var _ = require( 'lodash' );
var Hashids = require( "hashids" );
var hashidConfig = require( '../config/config.json' ).secrets.hashId;

var Ticket = db.Ticket;
var Company = db.Company;
var TicketMessage = db.TicketMessage;

var notifier = require( '../lib/akx.notifier.js' );
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var ticketNameHasher = new Hashids( hashidConfig, 10, "BQO258NH06VMRS1LX4J7WYKC3DIFTZUAG9EP" );
var _this = this;



exports.handleError = function( err, req, res ){
    util.handleError( 'ticket', err, req, res );
};




exports.index = function( req, res, next ){

    Ticket.findAll( {
        where: {
            company_id: req.user.company_id
        },
        order: [
            [ 'status', 'ASC' ],
            [ 'created_at', 'DESC' ]
        ]
    } ).done( function( err, tickets ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else if( !tickets ){
            res.send( 200, { tickets: [] } );
            return next();
        }
        else{
            for( var i = 0; i < tickets.length; i++ ){
                tickets[ i ].values.links = {
                    ticket_messages: '/ticketMessages?ticket_id=' + tickets[ i ].id
                };
            }
            res.send( 200, { tickets: tickets } );
            return next();
        }
    } )

};





exports.view = function( req, res, next ){

    req.assert( 'ticket_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        Ticket.find( {
            where: {
                id: req.params.ticket_id
            },
            include: {
                model: TicketMessage
            }
        } ).done( function( err, ticket ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !ticket ){
                res.send( 404, { errors: [ 'Ticket not found' ] } );
                return next();
            }
            else{
                ticket.values.links = {
                    ticket_messages: '/ticketMessages?ticket_id=' + ticket.id
                };

                res.send( 200, { ticket: ticket } );
                return next();
            }
        } )
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};




exports.create = function( req, res, next ){

    req.assert( 'ticket', 'isObject' );

    if( _.isEmpty( req.validationErrors ) ){

        var newTicket = Ticket.build( {
            title: req.body.ticket.title,
            name: ticketNameHasher.encode( new Date().getTime() ),
            company_id: req.user.company_id,
            status: 0
        } );
        newTicket.save().done( function( err ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                newTicket.values.title = newTicket.title;
                newTicket.values.name = newTicket.name;

                notifier.notifyCompany( 'akx-ticket-created', req.user.company_id, { ticket_name: newTicket.name }, req );
                res.send( 201, { ticket: newTicket } );
                logger.info( 'ticket', 'Ticket: ' + newTicket.name + 'has been created', {
                    req: req,
                    model: 'ticket',
                    model_id: newTicket.id
                } );
                return next();

            }
        } )
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};




exports.close = function( req, res, next ){

    req.assert( 'ticket_id', 'isString' );

    Ticket.find( {
        where: {
            id: req.params.ticket_id
        }
    } ).done( function( err, ticket ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else if( !ticket ){
            res.send( 404, { errors: [ 'Ticket not found' ] } );
            return next();
        }
        else{
            ticket.values.status = 1;
            ticket.save().done( function( err ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{
                    notifier.notifyCompany( 'akx-ticket-closed', req.user.company_id, { ticket_name: ticket.name }, req );
                    res.send( 200, { ticket: ticket } );
                    logger.info( 'ticket', 'Ticket: ' + ticket.name + 'has been closed', {
                        req: req,
                        model: 'ticket',
                        model_id: ticket.id
                    } );
                    return next();
                }
            } );
        }
    } )
};




exports.open = function( req, res, next ){

    req.assert( 'ticket_id', 'isString' );

    Ticket.find( {
        where: {
            id: req.params.ticket_id
        }
    } ).done( function( err, ticket ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else if( !ticket ){
            res.send( 404, { errors: [ 'Ticket not found' ] } );
            return next();
        }
        else{
            ticket.values.status = 0;
            ticket.save().done( function( err ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{
                    notifier.notifyCompany( 'akx-ticket-reopened', req.user.company_id, { ticket_name: ticket.name }, req );
                    res.send( 200, { ticket: ticket } );
                    logger.info( 'ticket', 'Ticket [' + ticket.name + '] has been opened', {
                        req: req,
                        model: 'ticket',
                        model_id: ticket.id
                    } );
                    return next();
                }
            } );
        }
    } )
};




