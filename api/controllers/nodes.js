




var Sequelize = require( 'sequelize' );
var _ = require( 'lodash' );
var math = require( 'mathjs' );
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
var Fee = db.Fee;

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'project', err, req, res );
};

var transports = require( '../config/config.json' ).akxLogger.transports;
var currentFileName = __filename.split( '/' ).pop();
var akxLogger = require( 'logger' )( currentFileName, transports );






exports.accept = function( req, res, next ){

    req.assert( 'node_id', 'isString' );
    req.assert( 'node', 'isObject' );

    if( _.isEmpty( req.validationErrors ) ){
        Node.find( {
            where: [
                { id: req.params.node_id }
            ]
        } ).then( function( node ){
            if( _.isEmpty( node ) ){
                res.send( 404 );
                return next();
            }
            else if( req.user.company_id !== node.company_id ){
                res.send( 403 );
                return next();
            }
            else{
                // Validate and change submitted values
                var validParams = [
                    { key: 'name', validation: 'isString', validationOptions: {} },
                    { key: 'notes', validation: 'isString', validationOptions: {} },
                    { key: 'allow_funding', validation: 'isNumber', validationOptions: {} }
                ];

                _.forEach( validParams, function( value ){
                    if( req.params.node.hasOwnProperty( value.key ) ){
                        // If the property is allowed null and is being set to null don't run the validation
                        if( Node.rawAttributes[ value.key ].allowNull && req.params.node[ value.key ] === null ){
                            node[ value.key ] = null;
                        }
                        else if( req.assert( 'node.' + value.key, value.validation, value.validationOptions ) === true ){
                            node.values[ value.key ] = req.params.node[ value.key ];
                        }
                    }
                } );
                if( _.isEmpty( req.validationErrors ) ){
                    return Project.find( node.project_id ).then( function( project ){
                        return Account.find( {
                            where: [
                                { id: req.params.node.account_id },
                                { type: 0 }
                            ]
                        } ).then( function( account ){
                            if( _.isEmpty( account ) ){
                                res.send( 400, { errors: [ 'Invalid account_id' ] } );
                                return next();
                            }
                            else if( account.company_id !== req.user.company_id ){
                                res.send( 403 );
                                return next();
                            }
                            else{
                                node.values.account_id = req.params.node.account_id;
                                if( project.deterministic === 1 ){
                                    node.values.status = 4;
                                }
                                else {
                                    node.values.status = 1;
                                }
                                return node.save();
                            }
                        } ).then( function(){
                            res.send( 200, { node: node } );
                            // Log
                            logger.info( 'project', 'accept invitation ( status=>1 ) node[' + node.id + '] for P-' + project.name + ' to status ' + req.params.node.status, {
                                req: req,
                                model: 'node',
                                model_id: node.id
                            } );
                            return next();
                        } );
                    } );
                }
            }
        } ).catch( function( err ){
            _this.handleError( err, req, res );
            return next();
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};






exports.decline = function( req, res, next ){

    req.assert( 'node_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Node.find( {
            where: [
                { id: req.params.node_id }
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
                else if( req.user.company_id != node.company_id ){
                    res.send( 403 );
                    return next();
                }
                else{
                    node.values.status = 2;
                    node.save()
                        .done( function( err ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else{
                                // Update inviter's parent_id
                                Node.find( {
                                    where: { parent_id: node.id }
                                } )
                                    .done( function( err, snode ){
                                        if( !!err ){
                                            _this.handleError( err, req, res );
                                            return next();
                                        }
                                        else{
                                            if( !_.isEmpty( snode ) ){
                                                snode.values.parent_id = null;
                                                snode.save();
                                            }
                                            res.send( 200, { node: node } );

                                            // Log
                                            Project.find( node.project_id ).done( function( err, project ){
                                                if( err || !project ){
                                                    logger.metaLog( 'cannot find project[' + node.project_id + ']' );
                                                    logger.info( 'project', 'node[' + node.id + '] to status 2 (declined)', {
                                                        req: req
                                                    } );
                                                }
                                                else{
                                                    logger.info( 'project', 'decline invitation ( status=>2 ) node[' + node.id + '] for P-' + project.name, {
                                                        req: req,
                                                        model: 'node',
                                                        model_id: node.id
                                                    } );
                                                }
                                                return next();
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





exports.update = function( req, res, next ){

    req.assert( 'node_id', 'isString' );
    req.assert( 'node', 'isObject' );

    if( _.isEmpty( req.validationErrors ) ){
        Node.find( {
            where: [
                { id: req.params.node_id }
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
                else if( req.user.company_id != node.company_id ){
                    res.send( 403 );
                    return next();
                }
                else{
                    // Validate and change submitted values
                    var validParams = [
                        { key: 'name', validation: 'isString', validationOptions: {} },
                        { key: 'notes', validation: 'isString', validationOptions: {} },
                        { key: 'allow_funding', validation: 'isNumber', validationOptions: {} }
                    ];

                    _.forEach( validParams, function( value ){
                        if( req.params.node.hasOwnProperty( value.key ) ){
                            // If the property is allowed null and is being set to null don't run the validation
                            if( Node.rawAttributes[ value.key ].allowNull && req.params.node[ value.key ] === null ){
                                node[ value.key ] = null;
                            }
                            else if( req.assert( 'node.' + value.key, value.validation, value.validationOptions ) === true ){
                                node.values[ value.key ] = req.params.node[ value.key ];
                            }
                        }
                    } );
                    if( _.isEmpty( req.validationErrors ) ){
                        if( !node.fund_id ){
                            node.values.allow_funding = req.body.node.allow_funding;
                        }
                        node.save()
                            .done( function( err ){
                                if( !!err ){
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else{
                                    res.send( 200, { node: node } );

                                    // Log
                                    Project.find( node.project_id ).done( function( err, project ){
                                        if( err || !project ){
                                            logger.metaLog( 'cannot find project[' + node.project_id + ']' );
                                            logger.info( 'project', 'node[' + node.id + '] updated', {
                                                req: req,
                                                model: 'node',
                                                model_id: node.id,
                                                previousValues: node.selectedValues
                                            } );
                                        }
                                        else{
                                            logger.info( 'project', 'updated node[' + node.id + '] for P-' + project.name, {
                                                req: req,
                                                model: 'node',
                                                model_id: node.id,
                                                previousValues: node.selectedValues
                                            } );
                                        }

                                        return next();
                                    } );
                                }
                            } )
                    }
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
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
                    var valid = false;
                    // My node
                    if( node.company_id === req.user.company_id || ( !_.isEmpty( node.fund ) && node.fund.investor_id === req.user.company_id ) ){
                        valid = true;
                    }
                    // Buyer viewing
                    else if( !_.isEmpty( node.bnode ) && ( ( node.bnode.company_id === req.user.company_id ) || ( !_.isEmpty( node.bnode.fund ) && node.bnode.fund.investor_id === req.user.company_id ) ) ){
                        valid = true;
                    }
                    // Supplier looking
                    else if( !_.isEmpty( node.snodes ) ){
                        _.forEach( node.snodes, function( value ){
                            if( value.company_id === req.user.company_id || ( !_.isEmpty( value.fund ) && value.fund.investor_id === req.user.company_id ) ){
                                node.values.points = 0;
                                node.values.points_cash = 0;
                                node.values.points_guarantee = 0;
                                valid = true;
                            }
                        } );
                    }

                    if( valid ){
                        if( !_.isEmpty( node.fund ) && node.fund.status === 2 ){
                        }
                        else{
                            node.values.fund_id = null;
                        }

                        // Do not show bnode
                        if( node.values.hasOwnProperty( 'bnode' ) ){
                            delete node.values.bnode;
                        }

                        // Do not show snodes
                        if( node.values.hasOwnProperty( 'snodes' ) ){
                            delete node.values.snodes;
                        }

                        if( node.company_id === req.user.company_id || ( !_.isEmpty( node.fund ) && node.fund.investor_id === req.user.company_id ) || ( !_.isEmpty( node.bnode ) && ( ( node.bnode.company_id === req.user.company_id ) || ( !_.isEmpty( node.bnode.fund ) && node.bnode.fund.investor_id === req.user.company_id ) ) ) ){

                            // Gather invoices
                            var invoices = [];
                            // If the requesting company does not own the node only show activated/paid invoices
                            if( node.company_id != req.user.company_id && ( !_.isEmpty( node.fund ) && node.fund.investor_id !== req.user.company_id ) ){
                                for( var i = 0; i < node.invoices.length; i++ ){
                                    if( node.invoices[ i ].status == 1 || node.invoices[ i ].status == 2 ){
                                        invoices.push( node.invoices[ i ] );
                                    }
                                }
                                node.values.fund_id = null;
                                node.values.account_id = null;
                            }
                            else{
                                invoices = node.invoices;
                            }

                            // Gather invoice_ids
                            var invoiceIds = [];
                            for( var i = 0; i < invoices.length; i++ ){
                                if( node.company_id !== req.user.company_id && invoices[ i ].status === 0 ){
                                    invoices[ i ] = null;
                                }
                                else{
                                    invoiceIds.push( invoices[ i ].id );
                                }
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
                        }
                        else{
                            if( node.values.hasOwnProperty( 'nodeItems' ) ){
                                delete node.values.nodeItems;
                            }

                            if( node.values.hasOwnProperty( 'invoices' ) ){
                                delete node.values.invoices;
                            }

                            if( node.values.hasOwnProperty( 'amendments' ) ){
                                delete node.values.amendments;
                            }

                            node.values.account_id = null;
                        }
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

    req.assert( 'ids', 'isArray' );

    if( _.isEmpty( req.validationErrors ) ){
        Node.findAll( {
            where: {
                id: req.params.ids
            },
            include: [
                {
                    model: Invoice
                },
                {
                    model: Node,
                    as: 'bnode',
                    attributes: [ 'company_id', 'status' ]
                },
                {
                    model: Node,
                    as: 'snodes',
                    attributes: [ 'company_id', 'status' ]
                }
            ]
        } ).done( function( err, nodes ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !nodes ){
                res.send( 404 );
                return next();
            }
            else{

                // Find which nodes can be accessed
                var validNodes = [];
                for( var i = 0; i < nodes.length; i++ ){

                    var valid = false;

                    // Company owns the node
                    if( nodes[ i ].company_id === req.user.company_id ){
                        valid = true;
                    }
                    // Company is in parent node
                    else if( !_.isEmpty( nodes[ i ].bnode ) && nodes[ i ].bnode.company_id === req.user.company_id ){
                        valid = true;
                    }
                    // Company is member of children nodes
                    else if( !_.isEmpty( nodes[ i ].snodes ) ){
                        _.forEach( nodes[ i ].snodes, function( value ){
                            if( value.company_id === req.user.company_id ){
                                nodes[ i ].values.points = 0;
                                nodes[ i ].values.points_cash = 0;
                                nodes[ i ].values.points_guarantee = 0;
                                valid = true;
                            }
                        } );
                    }

                    if( valid ){
                        var invoices = [];
                        // Do not collect draft invoices if company does not own this node
                        if( nodes[ i ].company_id != req.user.company_id ){
                            for( var j = 0; j < nodes[ i ].invoices.length; j++ ){
                                if( nodes[ i ].invoices[ j ].status == 1 ){
                                    invoices.push( nodes[ i ].invoices[ j ] );
                                }
                            }
                        }
                        // Collect all invoices
                        else{
                            invoices = nodes[ i ].invoices;
                        }

                        var invoiceIds = [];
                        for( var j = 0; j < invoices.length; j++ ){
                            invoiceIds.push( invoices[ j ].id );
                        }

                        nodes[ i ].values.invoices = invoiceIds;

                        if( nodes[ i ].values.hasOwnProperty( 'bnode' ) ){
                            delete nodes[ i ].values.bnode;
                        }

                        if( nodes[ i ].values.hasOwnProperty( 'snodes' ) ){
                            delete nodes[ i ].values.snodes;
                        }

                        validNodes.push( nodes[ i ] );
                    }

                }

                res.send( 200, { nodes: validNodes } );

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

    req.assert( 'node', 'isObject' );
    req.assert( 'node.project_id', 'isString' );
    req.assert( 'node.account_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        // Verify the project
        Project.find( {
            where: [
                { id: req.body.node.project_id }
            ],
            include: [
                {
                    model: Node
                }
            ]
        } ).done( function( err, project ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( _.isEmpty( project ) ){
                res.send( 400, { errors: [ 'Cannot find project' ] } );
                return next();
            }
            else if( !_.isEmpty( project.nodes ) ){
                res.send( 400, { errors: [ 'Project must not have any nodes' ] } );
                return next();
            }
            else if( req.user.company_id !== req.body.node.company_id ){
                res.send( 403 );
                return next();
            }
            else{

                // Verify account
                Account.find( {
                    where: [
                        { id: req.body.node.account_id },
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
                        var newNode = Node.build( {
                            company_id: req.user.company_id,
                            project_id: project.id,
                            account_id: account.id,
                            name: req.body.node.name,
                            notes: req.body.node.notes
                        } );

                        if( req.body.node.discount_rate ){
                            newNode.discount_rate = req.body.node.discount_rate;
                        }

                        if( project.deterministic ){
                            newNode.status = 4;
                        }
                        else{
                            newNode.status = 1;
                        }

                        newNode.save()
                            .done( function( err ){
                                if( !!err ){
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else{
                                    res.send( 201, { node: newNode } );

                                    logger.info( 'project', 'node[' + newNode.id + '] for P-' + project.name, {
                                        req: req,
                                        model: 'node',
                                        model_id: newNode.id
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





exports.pointFunds = function( req, res, next ){

    req.assert( 'node_id', 'isString' );
    req.assert( 'data', 'isObject' );
    req.assert( 'data.points', 'isNumber' );
    req.assert( 'data.cash', 'isNumber' );
    req.assert( 'data.account_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        var chainer = new Sequelize.Utils.QueryChainer;

        var pointsRequest = math.round( Number( req.body.data.points ), 2 );
        var cashRequest = math.round( Number( req.body.data.cash ), 2 );

        Node.find( {
            where: {
                id: req.params.node_id
            },
            include: [
                { model: Project }
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
                else if( pointsRequest < 0 || cashRequest < 0 ){
                    res.send( 400, { errors: [ 'Invalid amount' ] } );

                    logger.info( 'security', 'Negative points amount' + ' to node[' + node.id + ']', {
                        req: req
                    } );

                    return next();
                }
                else{
                    // Parent Node
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

                    // All parent node's children
                    chainer.add( Node.findAll( {
                        where: [
                            { parent_id: node.parent_id },
                            { status: [ 0, 1 ] }
                        ]
                    } ) );

                    // Company account cash balance
                    chainer.add( Account.find( {
                        where: {
                            id: req.body.data.account_id
                        }
                    } ) );

                    chainer.run().done( function( err, results ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else{
                            var parentNode = results[ 0 ];
                            var snodes = results[ 1 ];
                            var account = results[ 2 ];

                            // Allow access
                            if( parentNode.company_id == req.user.company_id && parentNode.account_id == account.id ){

                                // All points pointed out from parent
                                var totalPoints = 0;
                                for( var i = 0; i < snodes.length; i++ ){
                                    totalPoints += snodes[ i ].points;
                                }

                                var availablePoints = math.round( Math.max( parentNode.points * ( 1 - parentNode.company.fee.getInvoiceOutRate() ) + parentNode.points_cash - totalPoints, 0 ), 2 );
                                if( availablePoints < pointsRequest ){
                                    res.send( 400, {
                                        errors: [
                                            { 'data.points': 'Insufficient points' }
                                        ]
                                    } );

                                    return next();
                                }
                                else if( account.balance < cashRequest ){
                                    res.send( 400, {
                                        errors: [
                                            { 'data.cash': 'Insufficient cash' }
                                        ]
                                    } );

                                    return next();
                                }
                                else{
                                    if( node.project.deterministic ){
                                        db.sequelize.transaction( function( t ){
                                            return _this.commitFunds( parentNode.id, cashRequest, 0, t ).then( function(){
                                                t.commit();
                                                logger.info( 'project', 'pointed ' + req.body.data.cash + ' cash and ' + req.body.data.points + ' points to node[' + node.id + '] for P-' + node.project.name, {
                                                    req: req
                                                } );
                                                res.send( 200, { node: node } );
                                                return next();
                                            } ).catch( function( err ){
                                                t.rollback();
                                                _this.handleError( err, req, res );
                                                return next();
                                            } );
                                        } );
                                    }
                                    else{
                                        // Transaction
                                        if( cashRequest != 0 ){
                                            var newTrans = Transaction.build( {
                                                currency_id: account.currency_id,
                                                from_account_id: account.id,
                                                model: 'node',
                                                model_id: node.id,
                                                amount: cashRequest,
                                                status: 1,
                                                type: 2
                                            } );
                                            newTrans.save();
                                        }

                                        node.points += pointsRequest;
                                        node.points_cash += cashRequest;
                                        account.balance -= cashRequest;

                                        chainer.add( node.save() );
                                        chainer.add( account.save() );
                                        chainer.run().done( function( err, results ){
                                            if( !!err ){
                                                _this.handleError( err, req, res );
                                                return next();
                                            }
                                            else{
                                                res.send( 200, { node: node } );

                                                // Log
                                                Project.find( node.project_id ).done( function( err, project ){
                                                    if( err || !project ){
                                                        logger.metaLog( 'cannot find project[' + newNode.project_id + ']' );
                                                        logger.info( 'project', 'pointed ' + req.body.data.cash + ' cash and ' + req.body.data.points + ' points to node[' + node.id + ']', {
                                                            req: req,
                                                            model: 'node',
                                                            model_id: node.id
                                                        } );
                                                    }
                                                    else{
                                                        logger.info( 'project', 'pointed ' + req.body.data.cash + ' cash and ' + req.body.data.points + ' points to node[' + node.id + '] for P-' + project.name, {
                                                            req: req
                                                        } );
                                                    }
                                                    return next();
                                                } );
                                            }

                                        } );
                                    }
                                }
                            }
                            else{
                                res.send( 403 );
                                return next();
                            }
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


exports.commitFunds = function( parentNodeId, cashAvailable, pointsAvailable, t ){
    var parentNode;
    var childNode;
    var PCAmount = 0;
    var PAmount = 0;
    return Node.find( {
        where: [
            {
                id: parentNodeId,
                status: 1
            }
        ],
        include: [
            {
                model: Company,
                include: [
                    { model: Fee }
                ]
            },
            { model: Account }
        ]
    } ).then( function( pNode ){
        parentNode = pNode;
        return Node.find( {
            where: [
                {
                    parent_id: parentNodeId,
                    status: 1
                }
            ]
        } );
    } ).then( function( cNode ){
        if( _.isEmpty( cNode ) ){
            // Terminating condition is when current node has no child
            return;
        }
        else{
            var promises = [];
            childNode = cNode;
            PCAmount = math.round( cashAvailable, 2 );
            PAmount = math.round( pointsAvailable * ( 1 - ( parentNode.discount_rate / 100 ) ), 2 );

            if( PCAmount !== 0 ){
                var PCTrans = Transaction.build( {
                    currency_id: parentNode.account.currency_id,
                    from_account_id: parentNode.account.id,
                    model: 'node',
                    model_id: childNode.id,
                    amount: PCAmount,
                    status: 1,
                    type: 2
                } );
                promises.push( PCTrans.save( { transaction: t } ) );
                // Update account balance and childNode's points_cash
                parentNode.account.balance -= PCAmount;
                childNode.points_cash += PCAmount;
                PAmount = PCAmount;
                PCAmount = 0;
            }
            else if( PAmount !== 0 ){
                // Update account balance and childNode's points
                childNode.points += PAmount;
            }
            promises.push( parentNode.account.save( { transaction: t } ) );
            promises.push( childNode.save( { transaction: t } ) );
            return Promise.all( promises ).then( function(){
                return _this.commitFunds( childNode.id, PCAmount, PAmount, t );
            } );
        }
    } )
};






exports.returnFunds = function( req, res, next ){
    req.assert( 'node_id', 'isString' );
    req.assert( 'data', 'isObject' );
    req.assert( 'data.amount', 'isNumber' );

    var amountRequested = Number( req.body.data.amount );

    if( _.isEmpty( req.validationErrors ) ){
        Node.find( {
            where: {
                id: req.params.node_id
            },
            include: [
                { model: Account },
                { model: Project }
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
                else if( req.user.company_id !== node.company_id ){
                    res.send( 403 );
                    return next();
                }
                else if( amountRequested <= 0 ){
                    res.send( 400, {
                        errors: [
                            { 'data.amount': 'Invalid amount' }
                        ]
                    } );

                    logger.info( 'security', 'Negative or zero request amount' + ' from node[' + node.id + ']', {
                        req: req
                    } );

                    return next();
                }
                else{
                    var chainer = new Sequelize.Utils.QueryChainer;
                    chainer.add( Node.find( {
                        where: [
                            { id: node.parent_id }
                        ],
                        include: [
                            { model: Account }
                        ]
                    } ) );
                    chainer.add( Node.findAll( {
                        where: [
                            { parent_id: node.id },
                            { status: [ 0, 1 ] }
                        ]
                    } ) );
                    chainer.run().done( function( err, results ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else{
                            var bnode = results[ 0 ];
                            var snodes = results[ 1 ];
                            // Calculate available fund
                            // request <= total pointed in - total pointed out
                            var totalPointedIn = node.points + node.points_cash + node.points_guarantee;
                            var totalPointedOut = 0;
                            _.forEach( snodes, function( snode ){
                                totalPointedOut = snode.points;
                            } );
                            var availableFunds = totalPointedIn - totalPointedOut
                            if( amountRequested > availableFunds ){
                                res.send( 400, {
                                    errors: [
                                        { 'data.amount': 'Insufficient funds to return the amount requested.' }
                                    ]
                                } );
                                return next();
                            }
                            else{
                                // Take from PG
                                var amountLeft = amountRequested;
                                var amountPG = Math.min( node.points_guarantee, amountLeft );
                                amountLeft -= amountPG;
                                node.points_guarantee -= amountPG;
                                bnode.account.balance += amountPG;

                                // Take from PC
                                var amountPC = 0;
                                if( amountLeft > 0 ){
                                    amountPC = Math.min( node.points_cash, amountLeft );
                                    amountLeft -= amountPC;
                                    node.points_cash -= amountPC;
                                    bnode.account.balance += amountPC;
                                }
                                // Create cash transaction
                                var pointTrans = Transaction.build( {
                                    currency_id: node.project.currency_id,
                                    to_account_id: bnode.account.id,
                                    model: 'node',
                                    model_id: node.id,
                                    amount: amountPG + amountPC,
                                    status: 1,
                                    type: 2
                                } );

                                // Take from P
                                var amountP = 0;
                                if( amountLeft > 0 ){
                                    amountP = Math.min( node.points, amountLeft );
                                    amountLeft -= amountP;
                                    node.points -= amountP;
                                }

                                // Problem
                                if( amountLeft > 0 ){
                                    logger.error( 'project', 'There is a problem with the amount to be sent back from node[' + req.params.node_id + ']. Amount=' + amountRequested + ', PG=' + amountPG + ', PC=' + amountPC + ', P=' + amountP, {
                                        req: req
                                    } );
                                    res.send( 400, {
                                        errors: [
                                            { 'data.amount': 'There is a problem with the amount entered.' }
                                        ]
                                    } );
                                    return next();
                                }
                                else{
                                    node.save().done( function( err ){
                                        if( !!err ){
                                            _this.handleError( err, req, res );
                                            return next();
                                        }
                                        else{
                                            bnode.account.save().done( function( err ){
                                                if( !!err ){
                                                    _this.handleError( err, req, res );
                                                    return next();
                                                }
                                                else{
                                                    pointTrans.save().done( function( err ){
                                                        if( !!err ){
                                                            _this.handleError( err, req, res );
                                                            return next();
                                                        }
                                                        else{
                                                            logger.info( 'project', 'Fund sent back from node[' + req.params.node_id + ']. Amount=' + amountRequested + ', PG=' + amountPG + ', PC=' + amountPC + ', P=' + amountP, {
                                                                req: req,
                                                                model: 'node',
                                                                model_id: node.id
                                                            } );
                                                            res.send( 200, { status: 'Ok' } );
                                                            return next();
                                                        }
                                                    } );
                                                }
                                            } );
                                        }
                                    } );
                                }

                            }
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





exports.canInvoice = function( req, res, next ){

    req.assert( 'node_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        Node.find( {
            where: {
                id: req.params.node_id,
                company_id: req.user.company_id
            },
            include: [
                {
                    model: Project
                }
            ]
        } )
            .done( function( err, node ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( _.isEmpty( node ) ){
                    res.send( 404 );
                    return next();
                }
                else{
                    // Is tree project
                    if( node.project.type === 0 ){
                        res.send( 200, { canInvoice: true } );
                        return next();
                    }
                    else{
                        // Find child node
                        Node.find( {
                            where: [
                                { parent_id: node.id },
                                { status: [ 0, 1 ] }
                            ]
                        } ).done( function( err, child ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            // Is end supplier
                            else if( !child ){
                                res.send( 200, { canInvoice: true } );
                                return next();
                            }
                            else{
                                res.send( 200, { canInvoice: false } );
                                return next();
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

exports.activateSmartNode = function( req, res, next ){

    req.assert( 'node_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        var results = {};
        Node.find( {
            where: {
                id: req.params.node_id,
                company_id: req.user.company_id
            }
        } ).then( function( node ){
            if( _.isEmpty( node ) ){
                res.send( 404 );
                return next();
            }
            else{
                node.status = 1;
                results[ 'node' ] = node;
                return node.save();
            }
        } ).then( function( node ){
            if( !_.isEmpty( node ) ){
                return Node.findAll( {
                    where: {
                        project_id: node.project_id
                    }
                } );
            }
        } ).then( function( nodes ){
            if( !_.isEmpty( nodes ) ){
                var allNodesNotReady = false;

                nodes.forEach( function( node ){
                    allNodesNotReady = allNodesNotReady | ( node.status === 4 || node.status === 0 );
                } );

                if( !allNodesNotReady ){
                    return Project.find( nodes[ 0 ].project_id );
                }
            }
        } ).then( function( project ){
            if( project ){
                project.status = 2;
                project.save();
            }
            res.send( 200, { node: results.node } );
            return next();
        } ).catch( function( err ){
            _this.handleError( err, req, res );
            return next();
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};
