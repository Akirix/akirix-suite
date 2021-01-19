var db = require( '../models' );
var InfoRequest = db.InfoRequest;
var Document = db.Document;
var util = require( '../lib/akx.util.js' );
var _ = require( 'lodash' );
var moment = require( 'moment-timezone' );
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'info-request', err, req, res );
};



exports.index = function( req, res, next ){

    InfoRequest.findAll( {
        where: [
            db.Sequelize.or( { model_id: req.user.id }, { model_id: req.user.company_id } ),
            { status: 0 }
        ]
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
};



exports.view = function( req, res, next ){

    req.assert( 'info_request_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        InfoRequest.find( {
            where: [
                { id: req.params.info_request_id },
                db.Sequelize.or( { model_id: req.user.id }, { model_id: req.user.company_id } ),
                { status: 0 }
            ]
        } ).done( function( err, infoRequest ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !infoRequest ){
                res.send( 404, {} );
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

    if( _.isEmpty( req.validationErrors ) ){

        InfoRequest.find( {
            where: [
                { id: req.params.info_request_id },
                db.Sequelize.or( { model_id: req.user.id }, { model_id: req.user.company_id } ),
                { status: 0 }
            ]
        } ).done( function( err, infoRequest ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !infoRequest ){
                res.send( 404, {} );
                return next();
            }
            else if( infoRequest.type === 1 ){
                Document.find( {
                    where: {
                        model_id: infoRequest.id
                    }
                } ).done( function( err, document ){
                    if( !_.isEmpty( err ) ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else if( _.isEmpty( document ) ){
                        res.send( 400, { errors: [ "Document not found" ] } );
                        next();
                    }
                    else{
                        infoRequest.response = req.params.infoRequest.response;
                        infoRequest.status = 1;

                        infoRequest.save().then( function( updatedInfo ){
                            res.send( 200, { infoRequest: updatedInfo } );
                            return next();
                        } );
                    }
                } );
            }
            else{
                infoRequest.response = req.params.infoRequest.response;
                infoRequest.status = 1;

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



exports.checkInfoRequest = function( req, res, next ){

    if( req.user ){
        InfoRequest.findAll( {
            where: [
                db.Sequelize.or( { model_id: req.user.id }, { model_id: req.user.company_id } ),
                { status: 0 },
                {
                    deadLine: { lte: moment.utc().format() }
                }
            ]
        } ).done( function( err, infoRequests ){
            if( !!err ){
                return _this.handleError( err, req, res );
            }
            else if( !_.isEmpty( infoRequests ) ){
                return res.send( 423, { errors: [ 'Info request overdue found' ] } );
            }
            else{
                return next();
            }
        } );
    }
    else{
        return res.send( 401, {} );
    }
};
