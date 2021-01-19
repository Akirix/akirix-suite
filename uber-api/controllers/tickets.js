

var Sequelize = require( 'sequelize' );
var db = require( '../models' );
var uberDb = require( '../models_uber' );
var _ = require( 'lodash' );
var Hashids = require( "hashids" );
var hashidConfig = require( '../config/config.json' ).secrets.hashId;

var Ticket = db.Ticket;
var Company = db.Company;
var TicketMessage = db.TicketMessage;
var UberTask = uberDb.UberTask;
var UberTag = uberDb.UberTag;
var UberTagAssociation = uberDb.UberTagAssociation;

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var notifier = require( '../lib/akx.notifier.js' );
var ticketeNameHasher = new Hashids( hashidConfig, 5, "BQO258NH06VMRS1LX4J7WYKC3DIFTZUAG9EP" );
var _this = this;



exports.handleError = function( err, req, res ){
    util.handleError( 'ticket', err, req, res );
};



exports.index = function( req, res, next ){

    var query = {
        where: {},
        order: [
            [ 'status', 'ASC' ],
            [ 'priority', 'DESC' ],
            [ 'created_at', 'DESC' ]
        ]
    };

    req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
    req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );

    var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
    if( paged ){
        query[ 'offset' ] = ( req.params.page - 1 ) * req.params.per_page;
        query[ 'limit' ] = req.params.per_page;
    }

    var validFields = [ 'company_id', 'status', 'priority', 'uber_user_id' ];
    _.forEach( validFields, function( field ){
        if( _.has( req.params, field ) ){
            query.where[ field ] = req.params[ field ];
        }
    } );

    Ticket.findAndCountAll( query ).done( function( err, tickets ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else if( !tickets ){
            res.send( 200, { tickets: [] } );
            return next();
        }
        else{
            var totalPages = 1;
            if( paged ){
                var pageRatio = tickets.count / req.params.per_page;
                totalPages = Math.floor( pageRatio );
                if( pageRatio % 1 > 0 ){
                    totalPages++;
                }
            }

            for( var i = 0; i < tickets.length; i++ ){
                tickets.rows[ i ].values.links = {
                    ticket_messages: '/ticketMessages?ticket_id=' + tickets.rows[ i ].id
                };
            }
            res.send( 200, { tickets: tickets.rows, meta: { total_pages: totalPages } } );
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
    req.assert( 'ticket.company_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        var newTicket = Ticket.build( {
            name: ticketeNameHasher.encode( new Date().getTime() ),
            company_id: req.params.ticket.company_id,
            title: req.params.ticket.title,
            status: 0,
            priority: req.params.ticket.priority,
            uber_user_id: req.params.ticket.uber_user_id
        } );

        newTicket.save().done( function( err ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                newTicket.values.title = newTicket.title;
                newTicket.values.name = newTicket.name;
                newTicket.values.company_id = newTicket.company_id;

                res.send( 201, { ticket: newTicket } );
                notifier.notifyCompany( 'akx-ticket-created', req.params.ticket.company_id, { ticket_name: newTicket.name }, req );
                logger.info( 'ticket', 'New ticket created for company [' + newTicket.company_id + ']', {
                    req: req,
                    model: 'ticket',
                    model_id: newTicket.id
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



exports.update = function( req, res, next ){

    req.assert( 'ticket_id', 'isString' );
    req.assert( 'ticket', 'isObject' );

    if( _.isEmpty( req.validationErrors ) ){
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
                res.send( 404, { errors: [ 'No ticket found' ] } );
                return next();
            }
            else{
                var validParams = [
                    { key: 'priority', validation: 'isNumber' },
                    { key: 'uber_user_id', validation: 'isString' }
                ];

                _.forEach( validParams, function( value ){
                    if( req.params.ticket.hasOwnProperty( value.key ) ){
                        if( Ticket.rawAttributes[ value.key ].allowNull && req.params.ticket[ value.key ] === null ){
                            ticket.values[ value.key ] = null;
                        }
                        else if( req.assert( 'ticket.' + value.key, value.validation ) === true ){
                            ticket.values[ value.key ] = req.params.ticket[ value.key ];
                        }
                    }
                } );

                ticket.save().done( function( err ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else{
                        res.send( 200, { ticket: ticket } );
                        return next();
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



//not done not sure if we want to assert anything else or if we should check if tasks associated with ticket are done.
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
                    res.send( 200, { ticket: ticket } );
                    notifier.notifyCompany( 'akx-ticket-closed', ticket.company_id, { ticket_name: ticket.name }, req );
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
                    res.send( 200, { ticket: ticket } );
                    notifier.notifyCompany( 'akx-ticket-reopened', ticket.company_id, { ticket_name: ticket.name }, req );
                    logger.info( 'ticket', 'Ticket has been reopened', {
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



exports.createTag = function( req, res, next ){

    req.assert( 'ticket_id', 'isString' );
    req.assert( 'uberTag', 'isObject' );
    req.assert( 'uberTag.name', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        UberTag.find( {
            where: {
                name: req.params.uberTag.name
            }
        } ).done( function( err, uberTag ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( uberTag ){
                UberTagAssociation.find( {
                    where: {
                        uber_tag_id: uberTag.id,
                        model: 'ticket',
                        model_id: req.params.ticket_id
                    }
                } ).done( function( err, tagAssoc ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else if( tagAssoc ){
                        res.send( 200, { uberTag: uberTag } );
                        return next();
                    }
                    else{
                        var newUberTagAssociation = UberTagAssociation.build( {
                            uber_tag_id: uberTag.id,
                            model: 'ticket',
                            model_id: req.params.ticket_id
                        } );
                        newUberTagAssociation.save().done( function( err ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else{
                                res.send( 201, { uberTag: uberTag } );
                                return next();
                            }
                        } );
                    }
                } );
            }
            else{
                var newUberTag = UberTag.build( {
                    name: req.params.uberTag.name
                } );
                newUberTag.save().done( function( err ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else{
                        var newUberTagAssociation = UberTagAssociation.build( {
                            uber_tag_id: newUberTag.id,
                            model: 'Ticket',
                            model_id: req.params.ticket_id
                        } );
                        newUberTagAssociation.save().done( function( err ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            res.send( 201, { uberTag: newUberTag } );
                            return next();
                        } );
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



exports.deleteTag = function( req, res, next ){

    req.assert( 'ticket_id', 'isString' );
    req.assert( 'tag_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        UberTagAssociation.find( {
            where: {
                model: 'Ticket',
                model_id: req.params.ticket_id,
                uber_tag_id: req.params.tag_id
            }
        } ).done( function( err, UberTagAssociation ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                UberTagAssociation.destroy().done( function( err ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    res.send( 200, { status: 'Ok' } );
                    return next();
                } );
            }
        } )
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};
