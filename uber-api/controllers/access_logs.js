var math = require( 'mathjs' );
var platformDb = require( '../models' );
var UberDb = require( '../models_uber' );
var util = require( '../lib/akx.util.js' );
var AccessLog = platformDb.AccessLog;
var User = platformDb.User;

var _ = require( 'lodash' );
var moment = require( 'moment-timezone' );

var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'user', err, req, res );
};

exports.index = function( req, res, next ){
    var query = {
        order: [
            [ 'created_at', 'DESC' ]
        ]
    };
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
    AccessLog.findAndCountAll( query )
        .done( function( err, accessLogs ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                var totalPages = 1;
                if( paged ){
                    var pageRatio = accessLogs.count / req.params.per_page;
                    totalPages = Math.floor( pageRatio );
                    if( pageRatio % 1 > 0 ){
                        totalPages++;
                    }
                }
                res.send( 200, { accessLog: accessLogs.rows, meta: { total_pages: totalPages } } );
                return next();
            }
        } );
};

exports.view = function( req, res, next ){
    if( _.isEmpty( req.validationErrors ) ){
        AccessLog.find( {
            where: {
                id: req.params.access_log_id
            }
        } )
            .then( function( accessLog ){
                res.send( 200, { accessLog: accessLog } );
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