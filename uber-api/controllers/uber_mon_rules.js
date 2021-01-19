

var uberDb = require( '../models_uber' );
var platformDb = require( '../models' );
var UberMonRule = uberDb.UberMonRule;
var UberException = uberDb.UberException;

var _ = require( 'lodash' );
_.mixin( require( "lodash-inflection" ) );
var Promise = require( 'promise' );
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

var transports = require( '../config/config.json' ).akxLogger.transports;
var currentFileName = __filename.split( '/' ).pop();
var akxLogger = require( 'logger' )( currentFileName, transports );
var akxStrings = require( 'akx-strings' )();

exports.handleError = function( err, req, res ){
    util.handleError( 'uber-mon-rule', err, req, res );
};



exports.index = function( req, res, next ){

    var query = { where: {} };

    req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
    req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );
    req.params[ 'status' ] = parseInt( req.params[ 'status' ] );
    var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;

    if( paged ){
        query[ 'offset' ] = ( req.params.page - 1 ) * req.params.per_page;
        query[ 'limit' ] = req.params.per_page;
    }

    var validParams = [
        { key: 'model', validation: 'isString' },
        { key: 'status', validation: 'isNumber' }
    ];

    _.forEach( validParams, function( field ){
        if( _.has( req.params, field.key ) ){
            req.assert( field.key, field.validation );
            query.where[ field.key ] = req.params[ field.key ];
        }
    } );

    if( _.isEmpty( req.validationErrors ) ){

        UberMonRule.findAndCountAll( query ).then( function( uberMonRules ){
            var totalPages = 1;
            if( paged ){
                var pageRatio = uberMonRules.count / req.params.per_page;
                totalPages = Math.floor( pageRatio );
                if( pageRatio % 1 > 0 ){
                    totalPages++;
                }
            }
            res.send( 200, { uberMonRules: uberMonRules.rows, meta: { total_pages: totalPages } } );
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



exports.view = function( req, res, next ){

    req.assert( 'uber_mon_rule_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        UberMonRule.find( {
            where: {
                id: req.params.uber_mon_rule_id
            }
        } ).then( function( uberMonRule ){
            if( !uberMonRule ){
                res.send( 404, { errors: [ 'No Uber Monitor Rule found' ] } );
                logger.error( 'uber-mon-rule', 'Uber Monitor Rule with id [ ' + req.params.uber_mon_rule_id + ' ] not found', {
                    req: req
                } );
                return next();
            }

            res.send( 200, { uberMonRule: uberMonRule } );
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



exports.create = function( req, res, next ){

    req.assert( 'uberMonRule', 'isObject' );
    req.assert( 'uberMonRule.model', 'isString' );
    req.assert( 'uberMonRule.rule', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        UberMonRule.validateRule( req.params.uberMonRule.rule ).then( function(){
            return UberMonRule.create( req.params.uberMonRule );
        } ).then( function( uberMonRule ){
            logger.info( 'uber-mon-rule', 'New Uber Monitor Rule has been created', {
                req: req,
                model: 'uber-mon-rule',
                model_id: uberMonRule.id
            } );
            res.send( 201, { uberMonRule: uberMonRule } );
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



exports.update = function( req, res, next ){

    req.assert( 'uber_mon_rule_id', 'isString' );
    req.assert( 'uberMonRule', 'isObject' );

    if( _.isEmpty( req.validationErrors ) ){

        UberMonRule.find( {
            where: {
                id: req.params.uber_mon_rule_id
            }
        } ).then( function( uberMonRule ){
            if( _.isEmpty( uberMonRule ) ){
                res.send( 404, { errors: [ 'No Uber Monitor Rule found' ] } );
                return next();
            }
            else{
                if( req.params.uberMonRule.hasOwnProperty( 'model' ) && _.isString( req.params.uberMonRule.model ) ){
                    uberMonRule.values.model = req.params.uberMonRule.model;
                }
                if( req.params.uberMonRule.hasOwnProperty( 'name' ) ){
                    uberMonRule.values.name = req.params.uberMonRule.name;
                }
                if( req.params.uberMonRule.hasOwnProperty( 'rule' ) ){
                    UberMonRule.validateRule( req.params.uberMonRule.rule ).then( function(){
                        uberMonRule.values.rule = req.params.uberMonRule.rule;
                        return uberMonRule.save();
                    } ).then( function(){
                        logger.info( 'uber-mon-rule', 'Uber Monitor Rule with id of [ ' + req.params.uber_mon_rule_id + ' ] has been updated', {
                            req: req,
                            model: 'uber-mon-rule',
                            model_id: uberMonRule.id
                        } );
                        res.send( 200, { uberMonRule: uberMonRule } );
                        return next();
                    } ).catch( function( err ){
                        _this.handleError( err, req, res );
                        return next();
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



exports.activate = function( req, res, next ){

    req.assert( 'uber_mon_rule_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        UberMonRule.find( {
            where: {
                id: req.params.uber_mon_rule_id,
                status: 0
            }
        } ).then( function( uberMonRule ){
            if( _.isEmpty( uberMonRule ) ){
                res.send( 404, { errors: [ 'No Uber Monitor Rule found' ] } );
                return next();
            }
            else{
                uberMonRule.values.status = 1;
                return uberMonRule.save();
            }
        } ).then( function( uberMonRule ){
            if( uberMonRule ){
                res.send( 200, { uberMonRule: uberMonRule } );
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



exports.deactivate = function( req, res, next ){

    req.assert( 'uber_mon_rule_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        UberMonRule.find( {
            where: {
                id: req.params.uber_mon_rule_id,
                status: 1
            }
        } ).then( function( uberMonRule ){
            if( _.isEmpty( uberMonRule ) ){
                res.send( 404, { errors: [ 'No Uber Monitor Rule found' ] } );
                return next();
            }
            else{
                uberMonRule.values.status = 0;
                return uberMonRule.save();
            }
        } ).then( function( uberMonRule ){
            if( uberMonRule ){
                res.send( 200, { uberMonRule: uberMonRule } );
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



exports.qMatchUberMonRules = function( queueName, msg, modelName ){
    return new Promise( function( resolve, reject ){
        var flag = false;
        if( modelName ){
            UberMonRule.findAll( {
                where: {
                    model: modelName,
                    status: 1
                }
            } ).then( function( uberMonRules ){
                if( !_.isEmpty( uberMonRules ) ){
                    var promises = [];
                    uberMonRules.forEach( function( uberRule ){
                        var query = 'SELECT count(*) FROM ' + _.pluralize( modelName ) + ' WHERE (id="' + msg.id + '" AND ';
                        promises.push( platformDb.sequelize.query( query + uberRule.getQuery() ) );

                    } );
                    Promise.all( promises ).then( function( results ){
                        promises = [];
                        results.forEach( function( count, idx ){
                            if( count[ 0 ][ 'count(*)' ] > 0 ){
                                flag = true;
                                akxLogger.info( 'uber-mon-rule match: ' + uberMonRules[ idx ].name + '[' + uberMonRules[ idx ].id + ']', null, {
                                    model: modelName,
                                    model_id: msg.id
                                } );
                                var newException = UberException.build( {
                                    model: modelName,
                                    model_id: msg.id,
                                    raw_data: JSON.stringify( uberMonRules[ idx ] )
                                } );

                                promises.push( newException.save().then( function(){
                                    akxLogger.info( akxStrings.created( 'uber-exception', newException.id ), null,
                                        [
                                            { model: 'uber-exception', model_id: newException.id }
                                        ],
                                        { queueName: queueName, msg: msg, modelName: modelName }
                                    );
                                } ) );
                            }
                        } );
                        return Promise.all( promises ).then( function(){
                            resolve( flag );
                        } );
                    } ).catch( function( err ){
                        akxLogger.error( err, null, null, { queueName: queueName, msg: msg, modelName: modelName } );
                        reject();
                    } );
                }
                else{
                    akxLogger.info( 'no uber-mon-rule match for ' + modelName + ' ' + msg.id );
                    resolve( flag );
                }
            } ).catch( function( err ){
                akxLogger.error( err, null, null, { queueName: queueName, msg: msg, modelName: modelName } );
                reject();
            } );
        }
        else{
            akxLogger.error( new Error( 'Missing model name' ), null, null, { queueName: queueName, msg: msg, modelName: modelName } );
            reject();
        }
    } );
};
