




var _ = require( 'lodash' );
var db = require( '../models' );
var Currency = db.Currency;
var util = require( '../lib/akx.util.js' );
var _this = this;



exports.handleError = function( err, req, res ){
    util.handleError( 'currency', err, req, res );
};





exports.index = function( req, res, next ){
    Currency.findAll( {
        order: "FIELD(currencies.id, 'USD','EUR','GBP')"
    } )
        .done( function( err, currencies ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                res.send( 200, { currencies: currencies } );
                return next();
            }
        } );
}





exports.view = function( req, res, next ){
    req.assert( 'currency_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Currency.find( {
                where: {
                    id: req.params.currency_id
                }
            } )
            .done( function( err, currency ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !currency ){
                    res.send( 404, { errors: [ 'Currency not supported' ] } );
                    return next();
                }
                else{
                    res.send( 200, { currency: currency } );
                    return next();
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};