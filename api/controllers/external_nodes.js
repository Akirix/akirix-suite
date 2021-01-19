var Sequelize = require( 'sequelize' );
var _ = require( 'lodash' );
var db = require( '../models' );
var Node = db.Node;
var ExternalNode = db.ExternalNode;
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


exports.view = function( req, res, next ){
    ExternalNode.find( req.params.external_node_id ).then( function( eNode ){
        res.send( 200, { externalNode: eNode } );
        return next();
    } ).catch( function( err ){
        return util.handleLibError( err, req, res, akxLogger );
    } );

};


exports.index = function( req, res, next ){
    var queryOptions = {
        where: [],
        order: [
            [ 'created_at', 'DESC' ]
        ]
    };

    if( req.params.node_id ){
        queryOptions.where.push( { node_id: req.params.node_id } );
    }

    if( req.params.status ){
        queryOptions.where.push( { status: req.params.status } );
    }

    ExternalNode.findAll( queryOptions ).then( function( eNodes ){
        res.send( 200, { externalNodes: eNodes } );
        return next();
    } ).catch( function( err ){
        return util.handleLibError( err, req, res, akxLogger );
    } );

};

exports.create = function( req, res, next ){

    req.assert( 'externalNode', 'isObject' );
    req.assert( 'externalNode.node_id', 'isString' );
    req.assert( 'externalNode.project_id', 'isString' );
    req.assert( 'externalNode.name', 'isString' );
    req.assert( 'externalNode.email', 'isString' );


    if( _.isEmpty( req.validationErrors ) ){

        return ExternalNode.create( {
            node_id: req.body.externalNode.node_id,
            project_id: req.body.externalNode.project_id,
            name: req.body.externalNode.name,
            point_of_contact: req.body.externalNode.point_of_contact,
            phone: req.body.externalNode.phone,
            email: req.body.externalNode.email,
            company_id: req.user.company_id,
            status: 0
        } ).then( function( newNode ){
            res.send( 201, { externalNode: newNode } );
            return next();
        } ).catch( function( err ){
            return util.handleLibError( err, req, res, akxLogger );
        } );
    }
    else{
        return util.handleValidationErrors( req, res, akxLogger );
    }
};