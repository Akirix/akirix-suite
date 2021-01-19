

var Sequelize = require( 'sequelize' );
var db = require( '../models' );
var _ = require( 'lodash' );
var Promise = require( 'bluebird' );
var Charge = db.Charge;

var moment = require( 'moment-timezone' );

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;



exports.handleError = function( err, req, res ){
    util.handleError( 'document', err, req, res );
};




exports.index = function( req, res, next ){
    var query = {
        where: {},
        order: [
            [ 'status', 'ASC' ],
            [ 'type', 'DESC' ],
            [ 'created_at', 'DESC' ]
        ]
    };
    req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
    req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );
    var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
    if( paged ){
        query.offset = ( req.params.page - 1 ) * req.params.per_page;
        query.limit = req.params.per_page;
    }
    var validFields = [ 'status', 'type', 'company_id' ];
    _.forEach( validFields, function( field ){
        if( _.has( req.params, field ) ){
            query.where[ field ] = req.params[ field ];
        }
    } );
    if( _.isEmpty( req.validationErrors ) ){
        Charge.findAndCountAll( query )
            .done( function( err, charges ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{
                    var totalPages = 1;
                    if( paged ){
                        var pageRatio = charges.count / req.params.per_page;
                        totalPages = Math.floor( pageRatio );
                        if( pageRatio % 1 > 0 ){
                            totalPages++;
                        }
                    }
                    res.send( 200, { charges: charges.rows, meta: { total_pages: totalPages } } );
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
    req.assert( 'charge_id', 'isString' );
    if( _.isEmpty( req.validationErrors ) ){

        Charge.find( {
            where: {
                id: req.params.charge_id
            }
        } )
            .done( function( err, charge ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !charge ){
                    res.send( 404, { errors: [ 'No item found' ] } );
                    return next();
                }
                else{
                    res.send( 200, { charge: charge } );
                    return next();
                }
            } );

    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

