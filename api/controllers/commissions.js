


var Sequelize = require( 'sequelize' );
var _ = require( 'lodash' );
var db = require( '../models' );
var Commission = db.Commission;
var Company = db.Company;

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;



exports.handleError = function( err, req, res ){
    util.handleError( 'commission', err, req, res );
};




exports.index = function( req, res, next ){

    if( _.isEmpty( req.validationErrors ) ){
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

        var validFields = [ 'status', 'affiliate_id' ];
        _.forEach( validFields, function( field ){
            if( _.has( req.params, field ) ){
                query.where[ field ] = req.params[ field ];
            }
        } );

        Commission.findAndCountAll( query ).done( function( err, commissions ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !commissions ){
                res.send( 200, [] );
                return next();
            }
            else{
                var totalPages = 1;
                if( paged ){
                    var pageRatio = commissions.count / req.params.per_page;
                    totalPages = Math.floor( pageRatio );
                    if( pageRatio % 1 > 0 ){
                        totalPages++;
                    }
                }
                res.send( 200, { commissions: commissions.rows, meta: { total_pages: totalPages } } );
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
    req.assert( 'commission_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        var query = {
            where: [
                { id: req.params.commission_id },
                { affiliate_id: req.user.company_id }
            ]
        };

        Commission.find( query ).done( function( err, item ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !item ){
                res.send( 404 );
                logger.info( 'commission', 'No commission found for [' + req.params.commission_id + ']', {
                    req: req
                } );
                return next();
            }
            else{
                item.values.links = {
                    commission_payment_items: '/commissionPaymentItems?commission_id=' + item.id
                };
                res.send( 200, { commission: item } );
                return next();
            }
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};