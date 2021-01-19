



var Sequelize = require( 'sequelize' );
var moment = require( 'moment-timezone' );
var _ = require( 'lodash' );
var math = require( 'mathjs' );
var db = require( '../models' );
var Project = db.Project;
var Node = db.Node;
var NodeItem = db.NodeItem;
var Amendment = db.Amendment;
var Company = db.Company;

var notifier = require( '../lib/akx.notifier.js' );
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

exports.handleError = function( err, res, req ){
    util.handleError( 'document', err, res, req );
};





exports.index = function( req, res, next ){

};





exports.create = function( req, res, next ){

    req.assert( 'amendment', 'isObject' );
    req.assert( 'amendment.node_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Node.find( {
            where: [
                { id: req.body.amendment.node_id },
                { company_id: req.user.company_id }
            ],
            include: [
                { model: Company },
                { model: Project },
                {
                    model: Node,
                    as: 'bnode',
                    include: {
                        model: Company
                    }
                }
            ]
        } ).done( function( err, node ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !node ){
                res.send( 400, { errors: [ 'Invalid node_id' ] } );
                return next();
            }
            else if( node.project.type !== 1 ){
                res.send( 400, { errors: [ 'Only linear type projects can have products/rates amendments' ] } );
                return next();
            }
            else{
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !node ){
                    res.send( 404 );
                    return next();
                }
                else{
                    var newAmend = Amendment.build( {
                        node_id: req.body.amendment.node_id
                    } );

                    newAmend.save().done( function( err ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else{
                            res.send( 201, { amendment: newAmend } );

                            logger.info( 'project', 'Amendment sent for project P-' + node.project.name + ' node[' + node.id + ']', {
                                req: req,
                                model: 'amendment',
                                model_id: newAmend.id
                            } );

                            notifier.notifyCompany( 'akx-amendment-sent', req.user.company_id, { to_company_name: node.bnode.company.name + ' (XYZ' + node.bnode.company.account_number + ')', project_name: 'P-' + node.project.name }, req );
                            notifier.notifyCompany( 'akx-amendment-received', node.bnode.company.id, { from_company_name: node.company.name + ' (XYZ' + node.company.account_number + ')', project_name: 'P-' + node.project.name }, req );

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




exports.view = function( req, res, next ){
    req.assert( 'amendment_id', 'isString' );
    if( _.isEmpty( req.validationErrors ) ){
        Amendment.find( {
            where: [
                { id: req.params.amendment_id }
            ],
            include: [
                { model: Node }
            ]
        } ).done( function( err, amend ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !amend ){
                res.send( 404 );
                return next();
            }
            else{

                if( _.isEmpty( amend.node ) || _.isEmpty( amend.node.parent_id ) ){
                    logger.error( 'security', 'attempting to view an amendment while neither is the node or bnode', {
                        req: req
                    } );
                    res.send( 403 );
                    return next();
                }
                else{
                    Node.find( {
                        where: [
                            { id: amend.node.parent_id }
                        ]
                    } ).done( function( err, bnode ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else if( !amend ){
                            res.send( 404 );
                            return next();
                        }
                        else if( amend.node.company_id !== req.user.company_id && bnode.company_id !== req.user.company_id ){
                            res.send( 403 );
                            logger.error( 'security', 'company_id in node and bnode do not match the token company_id', {
                                req: req
                            } );
                            return next();
                        }
                        else{
                            NodeItem.findAll( {
                                where: [
                                    { node_id: amend.id }
                                ]
                            } ).done( function( err, items ){
                                if( !!err ){
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else{
                                    var itemIds = [];
                                    _.forEach( items, function( item ){
                                        itemIds.push( item.id );
                                    } );
                                    amend.values.node_items = itemIds;
                                    delete amend.values.node;

                                    res.send( 200, { amendment: amend } );
                                    return next();
                                }
                            } )
                        }
                    } )
                }
            }
        } )
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};




exports.update = function( req, res, next ){
    req.assert( 'amendment_id', 'isString' );
    req.assert( 'amendment', 'isObject' );
    req.assert( 'amendment.status', 'isIn', [ 1, 2, 3 ] );

    if( _.isEmpty( req.validationErrors ) ){
        Amendment.find( {
            where: [
                { id: req.params.amendment_id }
            ],
            include: [
                {
                    model: Node,
                    include: [
                        { model: Project },
                        {
                            model: Node,
                            as: 'bnode',
                            include: {
                                model: Company
                            }
                        }
                    ]

                }
            ]
        } ).done( function( err, amend ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !amend ){
                res.send( 404 );
                return next();
            }
            else if( amend.status !== 0 ){
                res.send( 400, { errors: [ 'Only pending amendments can be updated' ] } );
                return next();
            }
            else{

                if( _.isEmpty( amend.node ) || _.isEmpty( amend.node.parent_id ) ){
                    logger.error( 'security', 'attempting to decline an amendment while neither is the node or bnode', {
                        req: req
                    } );
                    res.send( 403 );
                    return next();
                }
                else{
                    Node.find( {
                        where: [
                            { id: amend.node.parent_id }
                        ]
                    } ).done( function( err, bnode ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else if( !amend ){
                            res.send( 404 );
                            return next();
                        }
                        else if( amend.node.company_id !== req.user.company_id && bnode.company_id !== req.user.company_id ){
                            res.send( 403 );
                            logger.error( 'security', 'company_id in node and bnode do not match the token company_id', {
                                req: req
                            } );
                            return next();
                        }
                        else{
                            amend.values.status = req.body.amendment.status;
                            // Accept
                            if( req.body.amendment.status === 1 ){
                                if( bnode.company_id !== req.user.company_id ){
                                    res.send( 403 );
                                    logger.error( 'security', 'Only bnode can accept/decline amendment.', {
                                        req: req
                                    } );
                                    return next();
                                }
                                else{
                                    amend.save().done( function( err ){
                                        if( !!err ){
                                            _this.handleError( err, req, res );
                                            return next();
                                        }
                                        else{
                                            var chainer = new Sequelize.Utils.QueryChainer;
                                            NodeItem.findAll( {
                                                where: [
                                                    { node_id: amend.node.id }
                                                ]
                                            } ).done( function( err, items ){
                                                if( !!err ){
                                                    _this.handleError( err, req, res );
                                                    return next();
                                                }
                                                else{
                                                    //
                                                    for( var i = 0; i < items.length; i++ ){
                                                        items[ i ].node_id = amend.id;
                                                        chainer.add( items[ i ].save() );
                                                    }

                                                    NodeItem.findAll( {
                                                        where: [
                                                            { node_id: amend.id }
                                                        ]
                                                    } ).done( function( err, items ){
                                                        if( !!err ){
                                                            _this.handleError( err, req, res );
                                                            return next();
                                                        }
                                                        else{
                                                            for( var i = 0; i < items.length; i++ ){
                                                                items[ i ].node_id = amend.node_id;
                                                                chainer.add( items[ i ].save() );
                                                            }

                                                            chainer.run().done( function( err, results ){
                                                                if( !!err ){
                                                                    _this.handleError( err, req, res );
                                                                    return next();
                                                                }
                                                                else{
                                                                    delete amend.values.node;
                                                                    res.send( 200, { amendment: amend } );
                                                                    logger.info( 'project', 'Amendment accepted [' + amend.id + ']', {
                                                                        req: req,
                                                                        model: 'amendment',
                                                                        model_id: amend.id
                                                                    } );
                                                                    notifier.notifyCompany( 'akx-amendment-accepted', amend.node.company_id, { project_name: 'P-' + amend.node.project.name }, req );
                                                                    return next();
                                                                }
                                                            } );
                                                        }
                                                    } )
                                                }
                                            } );
                                        }
                                    } )

                                }
                            }
                            // Decline
                            else if( req.body.amendment.status === 2 ){
                                if( bnode.company_id !== req.user.company_id ){
                                    res.send( 403 );
                                    logger.error( 'security', 'Only bnode can accept/decline amendment.', {
                                        req: req
                                    } );
                                    return next();
                                }
                                else{
                                    amend.save().done( function( err ){
                                        if( !!err ){
                                            _this.handleError( err, req, res );
                                            return next();
                                        }
                                        else{
                                            delete amend.values.node;
                                            res.send( 200, { amendment: amend } );
                                            logger.info( 'project', 'Amendment declined [' + amend.id + ']', {
                                                req: req,
                                                model: 'amendment',
                                                model_id: amend.id
                                            } );
                                            notifier.notifyCompany( 'akx-amendment-declined', amend.node.company_id, { project_name: 'P-' + amend.node.project.name }, req );
                                            return next();
                                        }
                                    } )
                                }
                            }
                            // Cancel
                            else if( req.body.amendment.status === 3 ){
                                if( amend.node.company_id !== req.user.company_id ){
                                    res.send( 403 );
                                    logger.error( 'security', 'Only originator can cancel amendment.', {
                                        req: req
                                    } );
                                    return next();
                                }
                                else{
                                    amend.save().done( function( err ){
                                        if( !!err ){
                                            _this.handleError( err, req, res );
                                            return next();
                                        }
                                        else{
                                            delete amend.values.node;
                                            res.send( 200, { amendment: amend } );
                                            logger.info( 'project', 'Amendment cancelled [' + amend.id + ']', {
                                                req: req,
                                                model: 'amendment',
                                                model_id: amend.id
                                            } );
                                            notifier.notifyCompany( 'akx-amendment-cancelled', req.user.company_id, { project_name: 'P-' + amend.node.project.name }, req );
                                            notifier.notifyCompany( 'akx-amendment-cancelled', amend.node.bnode.company.id, { project_name: 'P-' + amend.node.project.name }, req );
                                            return next();

                                        }
                                    } )
                                }
                            }
                        }
                    } )
                }
            }
        } )
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};
