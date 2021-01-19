

var Sequelize = require( 'sequelize' );
var Promise = require( 'promise' );
var _ = require( 'lodash' );
var db = require( '../models' );
var Hashids = require( "hashids" );
var Project = db.Project;
var Node = db.Node;
var Company = db.Company;
var Account = db.Account;
var Document = db.Document;
var notifier = require( '../lib/akx.notifier.js' );
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var hashidConfig = require( '../config/config.json' ).secrets.hashId;
var _this = this;



exports.handleError = function( err, req, res ){
    util.handleError( 'project', err, req, res );
};



exports.isFunded = function( nodes, node ){
    if( node ){
        var currNode = node;
        while( true ){
            if( currNode === undefined ){
                return false;
            }
            else if( currNode.points_cash > 0 || currNode.points_guarantee > 0 || currNode.points > 0 ){
                return true;
            }
            else if( !currNode.parent_id ){
                return false;
            }
            else{
                var currParent = _.find( nodes, function( theNode ){
                    return theNode.id == currNode.parent_id;
                } );
                currNode = currParent;
            }
        }
    }
    else{
        return false;
    }
};





exports.index = function( req, res, next ){

    var nodeOptions = {
        where: [
            { company_id: req.user.company_id },
            { status: [ 0, 1, 4 ] }
        ],
        order: [
            [ 'updated_at', 'DESC' ]
        ]
    }

    req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
    req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );

    var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
    if( paged ){
        nodeOptions.offset = ( req.params.page - 1 ) * req.params.per_page;
        nodeOptions.limit = req.params.per_page;
    }

    Node.findAndCountAll( nodeOptions )
        .done( function( err, nodes ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( _.isEmpty( nodes.rows ) ){
                res.send( 200, { projects: [] } );
                return next();
            }
            else{
                var totalPages = 1;
                var chainer = new Sequelize.Utils.QueryChainer;

                if( paged ){
                    var count = nodes.count;
                    var rem = count % req.params.per_page;
                    totalPages = Math.floor( count / req.params.per_page );

                    if( rem > 0 ){
                        totalPages++;
                    }
                }

                for( var i = 0; i < nodes.rows.length; i++ ){

                    // Find Project
                    chainer.add( Project.find( nodes.rows[ i ].project_id ) );

                    // Find Buyer
                    chainer.add( Node.find( {
                        //attributes: ['id'],
                        where: [
                            { id: nodes.rows[ i ].parent_id },
                            { status: [ 0, 1, 4 ] }
                        ]
                    } ) );

                    // Find Suppliers
                    chainer.add( Node.findAll( {
                        //attributes: ['id'],
                        where: [
                            { parent_id: nodes.rows[ i ].id },
                            { status: [ 0, 1, 4 ] }
                        ]
                    } ) );

                    // Find documents
                    chainer.add( Document.findAll( {
                        where: [
                            { model_id: nodes.rows[ i ].project_id },
                        ]
                    } ) );

                    // First 1st & 2nd buyer
                    chainer.add(
                        Node.findAll( {
                            where: [
                                { project_id: nodes.rows[ i ].project_id }
                            ]
                        } ) );
                }

                chainer.runSerially().done( function( err, results ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else{
                        var projects = [];

                        for( var i = 0; i < results.length; i = i + 5 ){
                            var nodeProject = results[ i ].values;

                            // Node
                            nodeProject.node = nodes.rows[ i / 5 ].id;
                            nodes.rows.push( nodes.rows[ i / 5 ] );

                            // Buyer
                            if( results[ i + 1 ] === null ){
                                nodeProject.bnode = results[ i + 1 ];
                            }
                            else{
                                nodeProject.bnode = results[ i + 1 ].id;
                                nodes.rows.push( results[ i + 1 ] );
                            }

                            // Suppliers
                            if( results[ i + 2 ] === null ){
                                nodeProject.snodes = null;
                            }
                            else{
                                nodeProject.snodes = [];
                                for( var j = 0; j < results[ i + 2 ].length; j++ ){
                                    nodeProject.snodes.push( results[ i + 2 ][ j ].id );
                                    nodes.rows.push( results[ i + 2 ][ j ] );
                                }
                            }

                            // Documents
                            if( results[ i + 3 ] === null ){
                                nodeProject.documents = null;
                            }
                            else{
                                nodeProject.documents = [];
                                for( var j = 0; j < results[ i + 3 ].length; j++ ){
                                    nodeProject.documents.push( results[ i + 3 ][ j ].id );
                                }
                            }

                            // Check all parents see if there is money committed
                            nodeProject.funded = exports.isFunded( results[ i + 4 ], nodes.rows[ i / 5 ] );

                            projects.push( nodeProject );
                        }
                    }

                    res.send( 200, { projects: projects, meta: { total_pages: totalPages } } );
                    return next();
                } );
            }
        } );
};




exports.view = function( req, res, next ){

    req.assert( 'project_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        // Find the requester node
        Node.find( {
            where: [
                { project_id: req.params.project_id },
                { company_id: req.user.company_id },
                { status: [ 0, 1, 3, 4 ] }
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
                    var chainer = new Sequelize.Utils.QueryChainer;

                    // Find Project
                    chainer.add( Project.find( node.project_id ) );

                    // Find Buyer
                    chainer.add( Node.find( {
                        //attributes: ['id'],
                        where: [
                            { id: node.parent_id },
                            { status: [ 0, 1, 4 ] }
                        ]
                    } ) );

                    // Find Suppliers
                    chainer.add( Node.findAll( {
                        //attributes: ['id'],
                        where: [
                            { parent_id: node.id },
                            { status: [ 0, 1, 4 ] }
                        ]
                    } ) );

                    // Find documents
                    chainer.add( Document.findAll( {
                        where: [
                            { model_id: req.params.project_id },
                        ]
                    } ) );

                    // Find all nodes in the project
                    chainer.add(
                        Node.findAll( {
                            where: [
                                { project_id: node.project_id }
                            ]
                        } ) );

                    chainer.runSerially().done( function( err, results ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else if( _.isEmpty( results[ 0 ] ) ){
                            res.send( 400, { errors: [ 'Cannot find project' ] } );
                            return next();
                        }
                        else{
                            var nodes = [];

                            var nodeProject = results[ 0 ].values;

                            nodeProject.node = node.id;

                            if( results[ 1 ] === null ){
                                nodeProject.bnode = null;
                            }
                            else{
                                nodeProject.bnode = results[ 1 ].id;
                            }

                            nodeProject.snodes = [];
                            for( var j = 0; j < results[ 2 ].length; j++ ){
                                nodeProject.snodes.push( results[ 2 ][ j ].id );
                                nodes.push( results[ 2 ][ j ].values );
                            }

                            nodeProject.documents = [];
                            for( var j = 0; j < results[ 3 ].length; j++ ){
                                nodeProject.documents.push( results[ 3 ][ j ].id );
                            }

                            // Check if buyers have committed anything
                            nodeProject.funded = exports.isFunded( results[ 4 ], node );

                            res.send( 200, { project: nodeProject } );
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





exports.create = function( req, res, next ){

    var hashids = new Hashids( hashidConfig, 5, "V8PNIK20E63754LDTSHFXAZ19BMJCQWUOGYR" );

    req.assert( 'project', 'isObject' );
    req.assert( 'project.currency_id', 'isString' );
    req.assert( 'project.type', 'isIn', Project.rawAttributes.type.validate.isIn[ 0 ] );

    if( _.isEmpty( req.validationErrors ) ){

        // Check if the creating user has an account for the currency they are trying to create
        Account.find( {
            where: [
                { company_id: req.user.company_id },
                { currency_id: req.params.project.currency_id }
            ]
        } ).done( function( err, account ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( _.isEmpty( account ) ){
                res.send( 400, { errors: [ 'Cannot find account with specified currency' ] } );
                return next();
            }
            else{
                var newProject = Project.build( {
                    type: req.params.project.type,
                    currency_id: account.currency_id,
                    invoice_deadline: req.params.project.invoice_deadline
                } );

                if( req.params.project.deterministic ){
                    newProject.deterministic = req.params.project.deterministic;
                    newProject.status = 0;
                }

                if( req.params.project.fixed_profit_margin ){
                    newProject.fixed_profit_margin = req.params.project.fixed_profit_margin;
                }

                newProject.save()
                    .done( function( err ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else{
                            newProject.name = hashids.encode( newProject.order );
                            newProject.save()
                                .done( function( err ){
                                    if( !!err ){
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else{
                                        logger.info( 'project', 'created P-' + newProject.name + '[' + newProject.id + ']', {
                                            req: req,
                                            model: 'project,',
                                            model_id: newProject.id
                                        } );

                                        res.send( 201, { project: newProject } );
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





exports.addBuyer = function( req, res, next ){

    req.assert( 'project_id', 'isString' );
    req.assert( 'data', 'isObject' );
    req.assert( 'data.account_number', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        var account_number = req.body.data.account_number;

        // Check if the project exists and the requesting company has a valid node in it
        Project.find( {
            where: {
                id: req.params.project_id
            },
            include: {
                model: Node,
                where: {
                    company_id: req.user.company_id,
                    status: [ 1, 4 ],
                    parent_id: null
                }
            }
        } ).done( function( err, project ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( _.isEmpty( project ) || project.nodes.length !== 1 ){
                res.send( 400, { errors: [ 'Invalid project_id' ] } );
                logger.error( 'project', 'project not found using project id [' + req.params.project_id + ']', {
                    req: req
                } );
                return next();
            }
            else{
                var requesterNode = project.nodes[ 0 ];
                Node.find( {
                    where: {
                        parent_id: project.nodes[ 0 ].id
                    }
                } ).then( function( snodes ){
                    if( project.deterministic === 1 ){
                        if( project.status !== 0 ){
                            res.send( 400, { errors: [ 'Invalid project status' ] } );
                            return next();
                        }
                        if( requesterNode.status !== 4 ){
                            res.send( 400, { errors: [ 'This project has already been set, you can no longer add a buyer' ] } );
                            return next();
                        }
                        if( !_.isEmpty( snodes ) ){
                            if( !_.isNumber( req.body.data.discount_rate ) || req.body.data.discount_rate < 0.25 || req.body.data.discount_rate > 100 ){
                                res.send( 400, { errors: [ 'Invalid discount_rate' ] } );
                                return next();
                            }
                        }
                    }
                    // Check if account number is valid
                    Company.find( {
                        where: {
                            account_number: account_number,
                            status: [ 1, 2 ]
                        }

                    } ).done( function( err, buyerCompany ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else if( _.isEmpty( buyerCompany ) ){
                            res.send( 400, { errors: [ 'Company can not be found for account XYZ-' + account_number ] } );
                            logger.error( 'project', 'Company not found using account number [' + account_number + ']', {
                                req: req
                            } );
                            return next();
                        }
                        else{

                            // Check if invitee company has a valid account
                            Account.find( {
                                where: [
                                    { company_id: buyerCompany.id },
                                    { currency_id: project.currency_id }
                                ]
                            } ).done( function( err, buyerAccount ){
                                if( !!err ){
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else if( _.isEmpty( buyerAccount ) ){
                                    res.send( 400, { errors: [ 'Company XYZ-' + account_number + ' does not have an account in the same currency as P-' + project.name ] } );
                                    logger.error( 'project', 'Company XYZ-' + account_number + ' does not have an account in the same currency as P-' + project.name, {
                                        req: req
                                    } );
                                    return next();
                                }
                                else{

                                    // Check if node for the company already exists in the project
                                    Node.findAll( {
                                        where: [
                                            { project_id: project.id },
                                            { company_id: buyerCompany.id },
                                            { status: [ 0, 1 ] }
                                        ]
                                    } ).done( function( err, projectNodes ){
                                        if( !!err ){
                                            _this.handleError( err, req, res );
                                            return next();
                                        }
                                        else if( !_.isEmpty( projectNodes ) ){
                                            res.send( 400, { errors: [ 'Company already in the project' ] } );
                                            logger.error( 'project', 'Company [' + buyerCompany.id + '] already exist in the project', {
                                                req: req
                                            } );
                                            return next();
                                        }
                                        else{

                                            var newNode = Node.build( {
                                                company_id: buyerCompany.id,
                                                project_id: project.id,
                                                account_id: buyerAccount.id,
                                                status: 0
                                            } );

                                            if( req.body.data.discount_rate ){
                                                newNode.discount_rate = Number( req.body.data.discount_rate );
                                                requesterNode.discount_rate = Number( req.body.data.discount_rate );
                                            }

                                            newNode.save().done( function( err ){
                                                if( !!err ){
                                                    _this.handleError( err, req, res );
                                                    return next();
                                                }
                                                else{

                                                    // Update requesting company's node
                                                    requesterNode.parent_id = newNode.id;
                                                    requesterNode.save().done( function( err ){
                                                        if( !!err ){
                                                            _this.handleError( err, req, res );
                                                            return next();
                                                        }
                                                        else{
                                                            res.send( 201, { node: newNode } );

                                                            // Log
                                                            Company.find( req.user.company_id ).done( function( err, fromCompany ){
                                                                if( !!err ){
                                                                    logger.metaLog( 'project', 'Cannot find from company information', {
                                                                        req: req
                                                                    } );

                                                                    logger.info( 'project', 'node[' + newNode.id + '] invited to project[' + req.params.project_id + '] as buyer', {
                                                                        req: req
                                                                    } );
                                                                }
                                                                else{
                                                                    notifier.notifyCompany( 'akx-project-invite', buyerCompany.id, { from_company_name: fromCompany.name + ' (XYZ ' + fromCompany.account_number + ')', project_name: 'P-' + project.name, role: 'buyer' }, req );
                                                                    logger.info( 'project', fromCompany.name + ' node[' + newNode.id + '] invited to project P-' + project.name + '[' + project.id + '] as buyer', {
                                                                        req: req,
                                                                        model: 'project',
                                                                        model_id: project.id
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
                            } );
                        }
                    } );
                } ).catch( function( err ){
                    _this.handleError( err, req, res );
                    return next();
                } );
            }
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};




exports.addSupplier = function( req, res, next ){

    req.assert( 'project_id', 'isString' );
    req.assert( 'data', 'isObject' );
    req.assert( 'data.account_number', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        var account_number = req.body.data.account_number;

        // Check if the project exists and the requesting company has a valid node in it
        Project.find( {
            where: {
                id: req.params.project_id
            },
            include: [
                {
                    model: Node,
                    where: {
                        company_id: req.user.company_id,
                        status: [ 1, 4 ]
                    }
                }
            ]
        } ).done( function( err, project ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( _.isEmpty( project ) || project.nodes.length !== 1 ){
                res.send( 400, { errors: [ 'Invalid project_id' ] } );
                logger.error( 'project', 'project not found using project id [' + req.params.project_id + ']', {
                    req: req
                } );
                return next();
            }
            else if( project.deterministic === 1 ){
                if( project.status !== 0 ){
                    res.send( 400, { errors: [ 'Invalid project status' ] } );
                    return next();
                }
                if( project.nodes[ 0 ].status !== 4 ){
                    res.send( 400, { errors: [ 'This project has already been set, you can no longer add a supplier' ] } );
                    return next();
                }
                if( project.nodes[ 0 ].parent_id ){
                    if( !_.isNumber( req.body.data.discount_rate ) || req.body.data.discount_rate < 0.25 || req.body.data.discount_rate > 100 ){
                        res.send( 400, { errors: [ 'Invalid discount_rate' ] } );
                        return next();
                    }
                }
            }
            var requesterNode = project.nodes[ 0 ];

                // Check if account number is valid
                Company.find( {
                    where: {
                        account_number: account_number,
                        status: [ 1, 2 ]
                    }
                } ).done( function( err, supplierCompany ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else if( _.isEmpty( supplierCompany ) ){
                        res.send( 400, { errors: [ 'Company can not be found for account XYZ-' + account_number ] } );
                        logger.error( 'project', 'Company not found using account number [' + account_number + ']', {
                            req: req
                        } );
                        return next();
                    }
                    else{

                        // Check if invitee company has a valid account
                        Account.find( {
                            where: [
                                { company_id: supplierCompany.id },
                                { currency_id: project.currency_id }
                            ]
                        } ).done( function( err, supplierAccount ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else if( _.isEmpty( supplierAccount ) ){
                                res.send( 400, { errors: [ 'Company XYZ-' + account_number + ' does not have an account in the same currency as P-' + project.name ] } );
                                logger.error( 'project', 'Company XYZ-' + account_number + ' does not have an account in the same currency as P-' + project.name, {
                                    req: req
                                } );
                                return next();
                            }
                            else{

                                // Check if node for the company already exists in the project
                                Node.findAll( {
                                    where: [
                                        { project_id: project.id },
                                        { company_id: supplierCompany.id },
                                        { status: [ 0, 1 ] }
                                    ]
                                } ).done( function( err, projectNodes ){
                                    if( !!err ){
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else if( !_.isEmpty( projectNodes ) ){
                                        res.send( 400, { errors: [ 'Company already in the project' ] } );
                                        logger.error( 'project', 'Company [' + supplierCompany.id + '] already exist in the project', {
                                            req: req
                                        } );
                                        return next();
                                    }
                                    else{

                                        var newNode = Node.build( {
                                            company_id: supplierCompany.id,
                                            project_id: project.id,
                                            parent_id: requesterNode.id,
                                            account_id: supplierAccount.id,
                                            status: 0
                                        } );

                                        if( req.body.data.discount_rate ){
                                            requesterNode.discount_rate = Number( req.body.data.discount_rate );
                                        }

                                        Promise.all( [ newNode.save(), requesterNode.save() ] )
                                            .then( function(){
                                                res.send( 201, { node: newNode } );

                                                // Log
                                                Company.find( req.user.company_id ).done( function( err, fromCompany ){
                                                    if( !!err ){
                                                        logger.metaLog( 'project', 'missing Project information', {
                                                            req: req
                                                        } );
                                                        logger.info( 'project', fromCompany.name + ' node[' + newNode.id + '] invited to project[' + project.id + '] as supplier', {
                                                            req: req,
                                                            model: 'project',
                                                            model_id: project.id
                                                        } );
                                                    }
                                                    else{
                                                        notifier.notifyCompany( 'akx-project-invite', supplierCompany.id, { from_company_name: fromCompany.name + ' (XYZ' + fromCompany.account_number + ')', project_name: 'P-' + project.name, role: 'supplier' }, req );
                                                        logger.info( 'project', 'node[' + newNode.id + '] invited to project P-' + project.name + '[' + project.id + '] as supplier', {
                                                            req: req
                                                        } );
                                                    }

                                                    return next();
                                                } );
                                            } ).catch( function( err ){
                                                _this.handleError( err, req, res );
                                                return next();
                                            } );
                                    }
                                } );
                            }
                        } );
                    }
                } );
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};
