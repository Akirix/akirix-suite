




var Sequelize = require( 'sequelize' );
var _ = require( 'lodash' );
var db = require( '../models' );
var Node = db.Node;
var Account = db.Account;
var Project = db.Project;
var Invoice = db.Invoice;
var Company = db.Company;
var Transaction = db.Transaction;
var NodeItem = db.NodeItem;
var Fund = db.Fund;
var Amendment = db.Amendment;

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'project', err, req, res );
};


exports.view = function( req, res, next ){

    req.assert( 'node_id', 'isString' );
    if( _.isEmpty( req.validationErrors ) ){

        Node.find( {
            where: {
                id: req.params.node_id
            },
            include: [
                {
                    model: Invoice
                },
                {
                    model: Fund
                },
                {
                    model: NodeItem
                },
                {
                    model: Amendment
                },
                {
                    model: Node,
                    as: 'bnode',
                    attributes: [ 'company_id', 'status' ],
                    include: {
                        model: Fund
                    }
                },
                {
                    model: Node,
                    as: 'snodes',
                    attributes: [ 'company_id', 'status' ],
                    include: {
                        model: Fund
                    }
                }
            ]
        } )
            .done( function( err, node ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !node ){
                    res.send( 404 );
                    return next();
                }
                else{
                    var valid = true;
                    if( valid ){
                        if( !_.isEmpty( node.fund ) && node.fund.status === 2 ){
                            node.values.fund = node.values.fund_id;
                        }
                        else{
                            node.values.fund = null;
                            node.values.fund_id = null;
                        }

                        // Gather invoices
                        var invoices = node.invoices;

                        // Gather invoice_ids
                        var invoiceIds = [];
                        for( var i = 0; i < invoices.length; i++ ){
                            invoiceIds.push( invoices[ i ].id );
                        }

                        // Gather node_item_ids
                        var nodeItemIds = [];
                        for( var i = 0; i < node.nodeItems.length; i++ ){
                            nodeItemIds.push( node.nodeItems[ i ].id );
                        }

                        // Amendments
                        var amendmentIds = [];
                        for( var i = 0; i < node.amendments.length; i++ ){
                            if( node.amendments[ i ].status === 0 ){
                                amendmentIds.push( node.amendments[ i ].id );
                            }
                        }

                        node.values.invoices = invoiceIds;
                        node.values.node_items = nodeItemIds;
                        node.values.amendments = amendmentIds;

                        res.send( 200, { node: node } );
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

exports.index = function( req, res, next ){

    var query = {
        where: [],
    };
    req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
    req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );

    var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
    if( paged ){
        query.offset = ( req.params.page - 1 ) * req.params.per_page;
        query.limit = req.params.per_page;
    }

    if( !_.isEmpty( req.params.company_id ) ){
        query.where.push( { company_id: req.params.company_id } );
    }

    if( req.params.parent_id !== undefined ){
        if( req.params.parent_id === null ){
            query.where.push( { parent_id: null } );
        }
        else{
            query.where.push( { parent_id: req.params.parent_id } );
        }
    }

    if( !_.isEmpty( req.params.project_id ) ){
        query.where.push( { project_id: req.params.project_id } );
    }

    if( _.isEmpty( query.where ) ){
        query.where = {};
    }

    Node.findAndCountAll( query ).then( function( nodes ){
        var totalPages = 1;
        if( paged ){
            var pageRatio = nodes.count / req.params.per_page;
            totalPages = Math.floor( pageRatio );
            if( pageRatio % 1 > 0 ){
                totalPages++;
            }
        }
        res.send( 200, { nodes: nodes.rows, meta: { total_pages: totalPages } } );
        return next();
    } ).catch( function( err ){
        return util.handleLibError( err, req, res, akxLogger );
    } );
};
