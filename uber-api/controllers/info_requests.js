var platformDb = require( '../models' );
var InfoRequest = platformDb.InfoRequest;
var util = require( '../lib/akx.util.js' );
var _ = require( 'lodash' );
var moment = require( 'moment-timezone' );
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'info-request', err, req, res );
};



exports.index = function( req, res, next ){

    req.assert( 'model_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        InfoRequest.findAll( {
            where: {
                model_id: req.params.model_id
            }
        } ).done( function( err, infoRequests ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                res.send( 200, { infoRequests: infoRequests } );
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

    req.assert( 'infoRequest', 'isObject' );
    req.assert( 'infoRequest.model_id', 'isString' );
    req.assert( 'infoRequest.model', 'isString' );
    req.assert( 'infoRequest.title', 'isString' );
    req.assert( 'infoRequest.type', 'isNumber' );
    req.assert( 'infoRequest.deadline', 'isDate' );
    req.assert( 'infoRequest.notes', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        req.params.infoRequest.model = req.params.infoRequest.model.toLowerCase();

        InfoRequest.create( req.params.infoRequest ).done(
            function( err, infoRequests ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{
                    res.send( 201, { infoRequest: infoRequests } );
                    return next();
                }
            }
        );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};



exports.view = function( req, res, next ){

    req.assert( 'info_request_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        InfoRequest.find( {
            where: {
                id: req.params.info_request_id
            }
        } ).done( function( err, infoRequest ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !infoRequest ){
                res.send( 404 );
                return next();
            }
            else{
                res.send( 200, { infoRequest: infoRequest } );
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

    req.assert( 'info_request_id', 'isString' );
    req.assert( 'infoRequest', 'isObject' );
    req.assert( 'infoRequest.model_id', 'isString' );
    req.assert( 'infoRequest.model', 'isString' );
    req.assert( 'infoRequest.type', 'isNumber' );
    req.assert( 'infoRequest.deadline', 'isDate' );
    req.assert( 'infoRequest.notes', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        InfoRequest.find( {
            where: {
                id: req.params.info_request_id
            }
        } ).done( function( err, infoRequest ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !infoRequest ){
                res.send( 404 );
                return next();
            }
            else{

                infoRequest.model = req.params.infoRequest.model.toLowerCase();
                infoRequest.model_id = req.params.infoRequest.model_id;
                infoRequest.notes = req.params.infoRequest.notes;
                infoRequest.type = req.params.infoRequest.type;
                infoRequest.deadline = req.params.infoRequest.deadline;

                infoRequest.save().done( function( err, updatedInfo ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    res.send( 200, { infoRequest: updatedInfo } );
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



exports.open = function( req, res, next ){

    req.assert( 'info_request_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        InfoRequest.find( {
            where: {
                id: req.params.info_request_id
            }
        } ).done( function( err, infoRequest ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !infoRequest ){
                res.send( 404 );
                return next();
            }
            else{
                infoRequest.status = 0;
                infoRequest.response = null;

                infoRequest.save().then( function( updatedInfo ){
                    res.send( 200, { infoRequest: updatedInfo } );
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



exports.close = function( req, res, next ){

    req.assert( 'info_request_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        InfoRequest.find( {
            where: {
                id: req.params.info_request_id
            }
        } ).done( function( err, infoRequest ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !infoRequest ){
                res.send( 404 );
                return next();
            }
            else{
                infoRequest.status = 1;
                infoRequest.response = 'closed by ' + req.user.name + ' user id: ' + req.user.id;

                infoRequest.save().then( function( updatedInfo ){
                    res.send( 200, { infoRequest: updatedInfo } );
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