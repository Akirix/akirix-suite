



var Sequelize = require( 'sequelize' );
var _ = require( 'lodash' );
var db = require( '../models' );
var Node = db.Node;
var Amendment = db.Amendment;
var Project = db.Project;
var NodeItem = db.NodeItem;

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'project', err, req, res );
};






exports.index = function( req, res, next ){

    req.assert( 'ids', 'isArray' );

    if( _.isEmpty( req.validationErrors ) ){
        NodeItem.findAll( {
            where: {
                id: req.params.ids
            },
            include: [
                {
                    model: Node,
                    include: [
                        {
                            model: Node,
                            as: 'bnode'
                        }
                    ]
                }
            ]
        } ).done( function( err, node_items ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !node_items ){
                res.send( 200, { node_items: [] } );
                return next();
            }
            else{
                var validNodeItems = [];
                _.forEach( node_items, function( value ){
                    if( !_.isEmpty( value.node ) ){
                        if( ( value.node.company_id === req.user.company_id ) || ( !_.isEmpty( value.node.bnode ) && value.node.bnode.company_id === req.user.company_id ) ){
                            delete value.values.node;
                            validNodeItems.push( value );
                        }
                    }
                } );

                res.send( 200, { node_items: validNodeItems } );
                return next();
            }
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};





exports.view = function( req, res, next ){

    req.assert( 'node_item_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        NodeItem.find( {
            where: {
                id: req.params.node_item_id
            }
        } )
            .done( function( err, item ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !item ){
                    res.send( 404 );
                    return next();
                }
                else{
                    Amendment.find( {
                        where: [
                            { id: item.node_id }
                        ]
                    } ).done( function( err, amend ){
                        var theNodeId = null;
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else if( _.isEmpty( amend ) ){
                            theNodeId = item.node_id;
                        }
                        else{
                            theNodeId = amend.node_id;
                        }
                        // Check node of the nodeItem
                        Node.find( theNodeId ).done( function( err, node ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else if( !item ){
                                res.send( 400, { errors: [ 'Could not find associated node of the item ' ] } );
                                return next();
                            }
                            else{
                                // Allow if company owns the node
                                if( node.company_id === req.user.company_id ){
                                    res.send( 200, { node_item: item } );
                                    return next();
                                }
                                else if( _.isEmpty( node.parent_id ) ){
                                    res.send( 404 );
                                    return next();
                                }
                                else{
                                    // Check parent node
                                    Node.find( node.parent_id ).done( function( err, parentNode ){
                                        if( !!err ){
                                            _this.handleError( err, req, res );
                                            return next();
                                        }
                                        else if( _.isEmpty( parentNode ) ){
                                            res.send( 404 );
                                            return next();
                                        }
                                        else if( parentNode.company_id !== req.user.company_id ){
                                            res.send( 404 );
                                            return next();
                                        }
                                        // Allow if requester owns the parent node
                                        else{
                                            res.send( 200, { node_item: item } );
                                            return next();
                                        }
                                    } );
                                }

                            }
                        } );
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

    req.assert( 'nodeItem', 'isObject' );
    req.assert( 'nodeItem.price', 'isNumber' );
    req.assert( 'nodeItem.node_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        // Check if it's for an amendment
        Amendment.find( {
            where: [
                { id: req.body.nodeItem.node_id }
            ],
            include: [
                { model: Node }
            ]
        } ).done( function( err, amend ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( _.isEmpty( amend ) ){
                // Proceed to next portion
                Node.find( {
                    where: {
                        id: req.body.nodeItem.node_id
                    }
                } ).done( function( err, node ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else if( _.isEmpty( node ) ){
                        res.send( 400 );
                        logger.error( 'project', 'No node found using node id [' + req.body.nodeItem.node_id + ']', {
                            req: req
                        } );
                        return next();
                    }
                    else{

                        var newItem = NodeItem.build( {
                            name: req.body.nodeItem.name,
                            price: req.body.nodeItem.price,
                            node_id: node.id,
                            project_id: node.project_id
                        } );

                        if( _.isEmpty( newItem.name ) ){
                            res.send( 400, { errors: [ { 'nodeItem.name': [ 'NodeItem name cannot be blank' ] } ] } );
                            logger.error( 'project', 'NodeItem name cannot be blank [' + node.id + ']', {
                                req: req
                            } );
                            return next();
                        }
                        else if( node.company_id !== req.user.company_id ){

                            Node.find( {
                                where: {
                                    id: node.parent_id
                                }
                            } ).done( function( err, bnode ){
                                if( !!err ){
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else if( _.isEmpty( bnode ) || bnode.company_id !== req.user.company_id ){
                                    res.send( 403 );

                                    logger.error( 'security', 'company_id in node does not match the token company_id', {
                                        req: req
                                    } );

                                    return next();
                                }
                                else{
                                    newItem.save().done( function( err ){
                                        if( !!err ){
                                            _this.handleError( err, req, res );
                                            return next();
                                        }
                                        else{
                                            logger.info( 'project', 'Node item [' + newItem.id + '] was created for node [' + node.id + ']', {
                                                req: req,
                                                model: 'node-item',
                                                model_id: newItem.id
                                            } );
                                            res.send( 201, { node_item: newItem } );
                                            return next();
                                        }
                                    } );
                                }
                            } );
                        }
                        else{
                            newItem.save().done( function( err ){
                                if( !!err ){
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else{
                                    logger.info( 'project', 'Node item [' + newItem.id + '] was created for node: ' + node.id + ']', {
                                        req: req,
                                        model: 'node-item',
                                        model_id: newItem.id
                                    } );
                                    res.send( 201, { node_item: newItem } );
                                    return next();
                                }
                            } );
                        }
                    }
                } );
            }
            else{
                var newItem = NodeItem.build( {
                    name: req.body.nodeItem.name,
                    price: req.body.nodeItem.price,
                    node_id: amend.id,
                    project_id: amend.node.project_id
                } );

                newItem.save().done( function( err ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else{
                        logger.info( 'project', 'Node item [' + newItem.id + '] was created for amendment [' + amend.id + ']', {
                            req: req,
                            model: 'node-item',
                            model_id: newItem.id
                        } );
                        res.send( 201, { node_item: newItem } );
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





exports.update = function( req, res, next ){

    req.assert( 'node_item_id', 'isString' );
    req.assert( 'nodeItem', 'isObject' );
    req.assert( 'nodeItem', 'notEmpty' );

    if( _.isEmpty( req.validationErrors ) ){
        NodeItem.find( {
            where: {
                id: req.params.node_item_id
            },
            include: [
                {
                    model: Node
                }
            ]
        } )
            .done( function( err, item ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !item ){
                    res.send( 404 );
                    return next();
                }
                else if( _.isEmpty( item.node ) ){
                    res.send( 404 );
                    return next();
                }
                else if( item.node.company_id !== req.user.company_id ){
                    res.send( 403 );
                    logger.error( 'security', 'company_id in node does not match the token company_id', {
                        req: req
                    } );
                    return next();
                }
                else{
                    var validParams = [
                        { key: 'name', validation: 'isString' },
                        { key: 'price', validation: 'isNumber' }
                    ];

                    _.forEach( validParams, function( value ){
                        if( req.params.nodeItem.hasOwnProperty( value.key ) ){

                            // If the property is allowed null and is being set to null don't run the validation
                            if( NodeItem.rawAttributes[ value.key ].allowNull && req.params.nodeItem[ value.key ] === null ){
                                invoice[ value.key ] = null;
                            }
                            else if( req.assert( 'nodeItem.' + value.key, value.validation ) === true ){
                                item[ value.key ] = req.params.nodeItem[ value.key ];
                            }
                        }
                    } );

                    item.node_id = item.node.id;

                    if( _.isEmpty( req.validationErrors ) ){
                        item.save().done( function( err ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else{
                                logger.info( 'project', 'Node item [' + item.id + '] has been updated', {
                                    req: req,
                                    model: 'node-item',
                                    model_id: item.id,
                                    previousValue: item.selectedValues
                                } );
                                res.send( 200, { node_item: item } );
                                return next();
                            }
                        } );
                    }
                    else{
                        util.handleValidationErrors( req, res );
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


