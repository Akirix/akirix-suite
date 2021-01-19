


var Sequelize = require( 'sequelize' );
var _ = require( 'lodash' );
var db = require( '../models' );
var Commission = db.Commission;
var CommissionPayment = db.CommissionPayment;
var CommissionPaymentItem = db.CommissionPaymentItem;

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'commission', err, req, res );
};






exports.index = function( req, res, next ){
    var query = {
        where: {},
        order: [
            [ 'updated_at', 'DESC' ]
        ]
    };

    req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
    req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );

    var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
    if( paged ){
        query.offset = ( req.params.page - 1 ) * req.params.per_page;
        query.limit = req.params.per_page;
    }

    var validFields = [ 'commission_id', 'affiliate_id', 'commission_payment_id' ];
    _.forEach( validFields, function( field ){
        if( _.has( req.params, field ) ){
            query.where[ field ] = req.params[ field ];
        }
    } );

    if( !_.isEmpty( req.params.commission_payment_id ) ){
        if( req.params.commission_payment_id === 'null' ){
            query.where[ 'commission_payment_id' ] = null;
        }
        else{
            query.where[ 'commission_payment_id' ] = req.params.commission_payment_id;
        }
    }

    if( _.isEmpty( req.validationErrors ) ){
        CommissionPaymentItem.findAndCountAll( query )
            .done( function( err, cpis ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{
                    var totalPages = 1;
                    if( paged ){
                        var pageRatio = cpis.count / req.params.per_page;
                        totalPages = Math.floor( pageRatio );
                        if( pageRatio % 1 > 0 ){
                            totalPages++;
                        }
                    }
                    res.send( 200, { commissionPaymentItems: cpis.rows, meta: { total_pages: totalPages } } );
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
    req.assert( 'commission_payment_item_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        CommissionPaymentItem.find( {
            where: {
                id: req.params.commission_payment_item_id
            }
        } ).done( function( err, item ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                res.send( 200, { commissionPaymentItem: item } );
                return next();
            }
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};
