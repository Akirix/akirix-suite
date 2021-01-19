var math = require( 'mathjs' );
var platformDb = require( '../models' );
var UberDb = require( '../models_uber' );
var util = require( '../lib/akx.util.js' );
var User = platformDb.User;
var UberPwned = UberDb.UberPwned;
var _ = require( 'lodash' );
var moment = require( 'moment-timezone' );

var util = require( '../lib/akx.util.js' );
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'user', err, req, res );
};

exports.index = function( req, res, next ){
    var query = {};
    if( _.isString( req.params.user_id ) ){
        query[ 'where' ] = {
            user_id: req.params.user_id
        };
    }
    req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
    req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );
    var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
    if( paged ){
        query.offset = ( req.params.page - 1 ) * req.params.per_page;
        query.limit = req.params.per_page;
    }
    UberPwned.findAndCountAll( query )
        .done( function( err, uberPwned ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                var totalPages = 1;
                if( paged ){
                    var pageRatio = uberPwned.count / req.params.per_page;
                    totalPages = Math.floor( pageRatio );
                    if( pageRatio % 1 > 0 ){
                        totalPages++;
                    }
                }
                res.send( 200, { uberPwned: uberPwned.rows, meta: { total_pages: totalPages } } );
                return next();
            }
        } );
};

exports.view = function( req, res, next ){
    req.assert( 'uber_pwned_id', 'isString' );
    var whereCond = [
        { id: req.params.uber_pwned_id }
    ];
    if( _.isEmpty( req.validationErrors ) ){
        UberPwned.find( {
            where: whereCond
        } )
            .then( function( uberPwned ){
                res.send( 200, { uberPwned: uberPwned } );
                return next();
            } )
            .catch( function( err ){
                _this.handleError( err, req, res );
                return next();
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};