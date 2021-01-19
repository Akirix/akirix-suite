

var db = require( '../models_uber' );
var UberException = db.UberException;
var util = require( '../lib/akx.util.js' );
var logger = require( '../lib/akx.logger.js' );
var _ = require( 'lodash' );
var _this = this;



exports.handleError = function( err, req, res ){
    util.handleError( 'uber-exception', err, req, res );
};



exports.create = function( data ){
    return UberException.create( data );
};


exports.checkExceptions = function( req, res, next ){

    var path = '';
    if( req.route.hasOwnProperty( 'path' ) ){
        path += req.route.path;
    }
    else if( req.route.hasOwnProperty( 'url' ) ){
        path += req.route.url;
    }
    else{
        logger.error( 'security', 'Missing url/path in route', {
            req: req
        } );
    }
    var model = '';
    var model_id = '';

    if( path.match( /(wire)/ig ) ){
        model += 'wire';
        model_id = req.params.wire_id;
    }
    else if( path.match( /(registration)/ig ) ){
        model += 'registration';
        model_id = req.params.registration_id;
    }
    else{
        return next();
    }

    UberException.count( {
        where: {
            model: model,
            model_id: model_id,
            status: 0
        }
    } ).then( function( exceptionsCount ){
        if( exceptionsCount > 0 ){
            return res.send( 405, {
                errors: [ {
                    status: 405,
                    title: 'There are exceptions for this ' + model
                } ]
            } );
        }
        else{
            return next();
        }
    } ).catch( function( err ){
        _this.handleError( err, req, res );
        return next();
    } );
};






exports.index = function( req, res, next ){
    req.assert( 'model', 'isString' );
    req.assert( 'model_id', 'isString' );

    var whereCond = {
        model_id: req.params.model_id,
        model: req.params.model,
    };

    if( !_.isEmpty( req.params.status ) ){
        whereCond[ 'status' ] = req.params.status;
    }

    if( _.isEmpty( req.validationErrors ) ){

        UberException.findAll( {
            where: whereCond
        } ).then( function( exceptions ){

            for( var i = 0; i < exceptions.length; i++ ){
                exceptions[ i ].values.raw_data = JSON.parse( exceptions[ i ].values.raw_data );
            }
            res.send( 200, { UberExceptions: exceptions } );
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

/**
 * @api {post} /UberExceptions/:uber_exception_id/accept Accept
 * @apiName UberExceptionsAccept
 * @apiVersion 1.0.0
 * @apiGroup UberExceptions
 * @apiDescription Changes status to 1 and adds reason.
 *
 * @apiParam (object} uber_exception The uber exception object.
 * @apiParam {String} uber_exception_id The id of the uber exception.
 * @apiParam (String} uber_exception.reason  The reason why this exception was accepted.
 *
 * @apiSuccess {Object[]} The UberExceptions object.
 *
 * @apiSucessExample {Json} Success-Response:
 *  HTTP/1.1 200 OK
 *      {
 *          UberExceptions:[
 *                  {
 *                    "id": "0fd6s4fd6s4fsd4f64fd556ds",
 *                    "model": "wire",
 *                    "model_id": "68f45dfsfd4564fd456fdsdfs4",
 *                    "reason": "This was a false positive not him",
 *                    "uber_user_id": "1f35fd468f45fds45fdsf45ds",
 *                    "status": 2,
 *                    "raw_data: { "index": "sanctions",
 *                    "type": "au-dfat",
 *                      "data": {
 *                          "Reference": "2486",
 *                          "Name of Individual or Entity": "Robert Gabriel MUGABE",
 *                          "Type": "Individual",
 *                          "Name Type": "Primary Name"
 *                       }
 *                  }
 *          ]
 *     }
 *
 * @apiError (500) {Object[]} errors The errors object.
 * @apiError {String} errors[0] An internal error has occurred.
 * @apiError (404) {Object[]} errors The errors object.
 * @apiError {String} errors[0] No exception was found.
 *
 * @apiErrorExample (JSON} Error-Response:
 *  HTTP/1.1 500 Internal Server Error
 *      {
 *          errors: [ 'An internal error has occurred' ]
 *      }
 **/



exports.accept = function( req, res, next ){

    req.assert( 'uber_exception_id', 'isString' );
    req.assert( 'uber_exception', 'isObject' );
    req.assert( 'uber_exception.reason', 'isText' );

    if( _.isEmpty( req.validationErrors ) ){

        UberException.find( {
            where: {
                id: req.params.uber_exception_id
            }
        } ).then( function( exception ){
            if( !exception ){
                res.send( 404, { errors: [ 'No exception was found' ] } );
                logger.error( 'uber-exception', 'UberException with id of [ ' + req.params.uber_exception_id + ' ] was not found' );
                return next();
            }
            else{
                exception.status = 1;
                exception.reason = req.params.uber_exception.reason;
                exception.uber_user_id = req.user.id;
                return exception.save();
            }
        } ).then( function( exception ){
            if( exception ){
                res.send( 200, { UberException: exception } );
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

/**
 * @api {post} /UberExceptions/:uber_exception_id/reject Reject
 * @apiName UberExceptionsReject
 * @apiVersion 1.0.0
 * @apiGroup UberExceptions
 * @apiDescription Changes status to 2 and adds reason.
 *
 * @apiParam (object} uber_exception The uber exception object.
 * @apiParam {String} uber_exception_id The id of the uber exception.
 * @apiParam (String} uber_exception.reason  The reason why this exception was accepted.
 *
 * @apiSuccess {String} "Ok".
 *
 * @apiSucessExample {Json} Success-Response:
 *  HTTP/1.1 200 OK
 *      "Ok"
 *
 * @apiError (500) {Object[]} errors The errors object.
 * @apiError {String} errors[0] An internal error has occurred.
 * @apiError (404) {Object[]} errors The errors object.
 * @apiError {String} errors[0] No exception was found.
 *
 * @apiErrorExample (JSON} Error-Response:
 *  HTTP/1.1 500 Internal Server Error
 *      {
 *          errors: [ 'An internal error has occurred' ]
 *      }
 **/



exports.reject = function( req, res, next ){

    req.assert( 'uber_exception_id', 'isString' );
    req.assert( 'uber_exception', 'isObject' );
    req.assert( 'uber_exception.reason', 'isText' );

    if( _.isEmpty( req.validationErrors ) ){

        UberException.find( {
            where: {
                id: req.params.uber_exception_id
            }
        } ).then( function( exception ){
            if( !exception ){
                res.send( 404, { errors: [ 'No exception was found' ] } );
                logger.error( 'uber-exception', 'UberException with id of [ ' + req.params.uber_exception_id + ' ] was not found' );
                return next();
            }
            else{
                exception.status = 2;
                exception.reason = req.params.uber_exception.reason;
                exception.uber_user_id = req.user.id;
                return exception.save();
            }
        } ).then( function( exception ){
            if( exception ){
                res.send( 200, { UberException: exception } );
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
