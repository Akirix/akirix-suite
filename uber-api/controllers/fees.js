
var Sequelize = require( 'sequelize' );
var Globalize = require( 'globalize' );
var moment = require( 'moment-timezone' );
var db = require( '../models' );
var _ = require( 'lodash' );
var Hashids = require( "hashids" );

var Fee = db.Fee;
var Company = db.Company;

var notifier = require( '../lib/akx.notifier.js' );
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;



exports.handleError = function( err, req, res ){
    util.handleError( 'fee', err, req, res );
};



exports.index = function( req, res, next ){

    Fee.findAll( {
        where: {
            company_id: req.params.company_id
        }
    } ).done( function( err, fees ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else{
            res.send( 200, { fees: fees } );
            return next();
        }
    } )
};



exports.update = function( req, res, next ){

    req.assert( 'fee', 'isObject' );
    req.assert( 'fee_id', 'isString' );
    req.assert( 'fee.company_id', 'isString' );
    req.assert( 'fee.fee_data', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        Fee.find( {
            where: {
                id: req.params.fee_id,
                company_id: req.params.fee.company_id
            }
        } ).done( function( err, fee ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !fee ){
                res.send( 404, { errors: [ 'No fees found with company id of [' + req.params.fee.company_id + ']' ] } );
                return next();
            }
            else{
                fee.validateFee( req.params.fee.fee_data ).then( function(){
                    fee.fee_data = req.params.fee.fee_data;
                    fee.save().done( function( err, fee ){
                        res.send( 200, { fee: fee } );
                        return next();
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