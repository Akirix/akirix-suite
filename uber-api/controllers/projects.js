

var Sequelize = require( 'sequelize' );
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

var transports = require( '../config/config.json' ).akxLogger.transports;
var currentFileName = __filename.split( '/' ).pop();
var akxLogger = require( 'logger' )( currentFileName, transports );



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
    var query = {
        where: [],
        order: 'created_at DESC'
    };
    req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
    req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );

    var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
    if( paged ){
        query.offset = ( req.params.page - 1 ) * req.params.per_page;
        query.limit = req.params.per_page;
    }

    if( !_.isEmpty( req.params.type ) ){
        query.where.push( { type: req.params.type } );
    }

    if( !_.isEmpty( req.params.deterministic ) ){
        query.where.push( { deterministic: req.params.deterministic } );
    }


    if( !_.isEmpty( req.params.name ) ){
        req.params.name = req.params.name.trim();
        query.where.push( { name: { like: '%' + req.params.name + '%' } } );
    }

    if( _.isEmpty( query.where ) ){
        query.where = {};
    }

    Project.findAndCountAll( query ).then( function( projects ){
        var totalPages = 1;
        if( paged ){
            var pageRatio = projects.count / req.params.per_page;
            totalPages = Math.floor( pageRatio );
            if( pageRatio % 1 > 0 ){
                totalPages++;
            }
        }
        res.send( 200, { projects: projects.rows, meta: { total_pages: totalPages } } );
        return next();
    } ).catch( function( err ){
        return util.handleLibError( err, req, res, akxLogger );
    } );
};




exports.view = function( req, res, next ){

    Project.find( {
        where: {
            id: req.params.project_id
        }
    } ).then( function( project ){
        if( !project ){
            return res.send( 404 );
        }
        else{
            res.send( 200, { project: project } );
            return next();
        }
    } ).catch( function( err ){
        return util.handleLibError( err, req, res, akxLogger );
    } );
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
                    currency_id: account.currency_id
                } );

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
                                            req: req
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
            include: [
                {
                    model: Node,
                    where: {
                        company_id: req.user.company_id,
                        status: 1,
                        parent_id: null
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
                return next();
            }
            else{
                var requesterNode = project.nodes[ 0 ];

                // Check if account number is valid
                Company.find( {
                    where: [
                        { account_number: account_number }
                    ]
                } ).done( function( err, buyerCompany ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else if( _.isEmpty( buyerCompany ) ){
                        res.send( 400, { errors: [ 'Company can not be found for account XYZ-' + account_number ] } );
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
                                        return next();
                                    }
                                    else{

                                        var newNode = Node.build( {
                                            company_id: buyerCompany.id,
                                            project_id: project.id,
                                            account_id: buyerAccount.id,
                                            fee_invoice: buyerAccount.fee_invoice,
                                            status: 0
                                        } );

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
                                                                    req: req
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
                        status: 1
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
                return next();
            }
            else{
                var requesterNode = project.nodes[ 0 ];

                // Check if account number is valid
                Company.find( {
                    where: [
                        { account_number: account_number }
                    ]
                } ).done( function( err, supplierCompany ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else if( _.isEmpty( supplierCompany ) ){
                        res.send( 400, { errors: [ 'Company can not be found for account XYZ-' + account_number ] } );
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
                                        res.send( 400, { error: [ 'Company already in the project' ] } );
                                        return next();
                                    }
                                    else{

                                        var newNode = Node.build( {
                                            company_id: supplierCompany.id,
                                            project_id: project.id,
                                            parent_id: requesterNode.id,
                                            account_id: supplierAccount.id,
                                            fee_invoice: supplierAccount.fee_invoice,
                                            status: 0
                                        } );

                                        newNode.save()
                                            .done( function( err ){
                                                if( !!err ){
                                                    _this.handleError( err, req, res );
                                                    return next();
                                                }
                                                else{
                                                    res.send( 201, { node: newNode } );

                                                    // Log
                                                    Company.find( req.user.company_id ).done( function( err, fromCompany ){
                                                        if( !!err ){
                                                            logger.metaLog( 'project', 'missing Project information', {
                                                                req: req
                                                            } );
                                                            logger.info( 'project', fromCompany.name + ' node[' + newNode.id + '] invited to project[' + project.id + '] as supplier', {
                                                                req: req
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
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.activateSmartProject = function( req, res, next ){

    req.assert( 'project_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Project.find( {
            where: {
                id: req.params.project_id
            },
            include: [
                { model: Node }
            ]
        } ).then( function( project ){
            if( _.isEmpty( project ) ){
                res.send( 404, { errors: [ 'No project found with that id' ] } );
                return next();
            }
            else{
                var nodeIsNotActive = false;
                project.nodes.forEach( function( node ){
                    nodeIsNotActive = nodeIsNotActive | node.status !== 1
                } );
                if( nodeIsNotActive ){
                    res.send( 404, { errors: [ 'Not all companies have activated there nodes' ] } );
                    return next();
                }
                else{
                    project.status = 1;
                    return project.save();
                }
            }
        } ).then( function( project ){
            if( !_.isEmpty( project ) ){
                res.send( 200, { project: project } );
                return next();
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
