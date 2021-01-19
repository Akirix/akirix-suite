


var Sequelize = require( 'sequelize' );
var _ = require( 'lodash' );
var db = require( '../models' );
var Commission = db.Commission;
var CommissionPayment = db.CommissionPayment;

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'commission', err, req, res );
};






exports.index = function( req, res, next ){
    var query = {
        where: {
            affiliate_id: req.user.company_id
        }
    };

    req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
    req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );

    var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
    if( paged ){
        query.offset = ( req.params.page - 1 ) * req.params.per_page;
        query.limit = req.params.per_page;
    }

    var validFields = [ 'affiliate_id', 'status' ];
    _.forEach( validFields, function( field ){
        if( _.has( req.params, field ) ){
            query.where[ field ] = req.params[ field ];
        }
    } );

    if( _.isEmpty( req.validationErrors ) ){
        CommissionPayment.findAndCountAll( query )
            .done( function( err, cps ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{
                    var totalPages = 1;
                    if( paged ){
                        var pageRatio = cps.count / req.params.per_page;
                        totalPages = Math.floor( pageRatio );
                        if( pageRatio % 1 > 0 ){
                            totalPages++;
                        }
                    }
                    res.send( 200, { commissionPayments: cps.rows, meta: { total_pages: totalPages } } );
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
    req.assert( 'commission_payment_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        var query = {
            where: [ {
                id: req.params.commission_payment_id,
                affiliate_id: req.user.company_id
            } ]
        };
        CommissionPayment.find( query ).done( function( err, commissionpayment ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !commissionpayment ){
                res.send( 404 );
                return next();
            }
            else{
                res.send( 200, { CommissionPayment: commissionpayment } );
                return next();
            }
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }

};