

var fs = require( 'fs' );
var Sequelize = require( 'sequelize' );
var db = require( '../models' );
var _ = require( 'lodash' );
var Promise = require( 'bluebird' );
var Statement = db.Statement;
var Account = db.Account;
var stream = require( 'stream' );
var config = require( '../config/config.json' );
var AWS = require( 'aws-sdk' );

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

AWS.config.update( {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey
} );
var S3 = new AWS.S3( { params: { Bucket: config.aws.statementBucket } } );



exports.handleError = function( err, req, res ){
    util.handleError( 'statement', err, req, res );
};






exports.index = function( req, res, next ){
    var whereCond = {};

    var validFields = [ 'account_id', 'company_id' ];
    _.forEach( validFields, function( field ){
        if( _.has( req.params, field ) ){
            whereCond[ field ] = req.params[ field ];
        }
    } );


    Statement.findAll( {
        where: whereCond,
        order: [
            [ 'year', 'DESC' ],
            [ 'month', 'DESC' ]
        ]
    } )
        .done( function( err, statements ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                res.send( 200, { statements: statements } );
                return next();
            }
        } );
};







exports.download = function( req, res, next ){

    req.assert( 'statement_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Statement.find( {
            where: {
                id: req.params.statement_id
            }
        } )
            .done( function( err, statement ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !statement ){
                    res.send( 404 );
                    return next();
                }
                else{
                	Account.find( {
                		where: {
                			id: statement.account_id
                		}
                	} ).done( function( err, account ){
                		if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else if( !account ){
                            res.send( 404 );
                            return next();
                        }
                        else{
		                    if( statement.s3_uri ){
		                        S3.getObject( { Key: statement.id } ).promise().then( function( data ){
		                            res.setHeader( 'Content-disposition', 'attachment; filename="' + account.currency_id + ' ' + statement.year + ( '0' + statement.month).slice( -2 ) + '.pdf"' );
		                            res.setHeader( 'Content-type', 'application/pdf' );
		                            var bufferStream = new stream.PassThrough();
		                            bufferStream.end( data.Body );
		                            bufferStream.pipe( res );
		                            bufferStream.on( 'end', function(){
		                                return next();
		                            } );
		                        } ).catch( function( err ){
		                            _this.handleError( err, req, res );
		                            return next();
		                        } )
		                    }
		                    else{
		                        var path = __dirname + "/../documents-platform/statements/" + statement.id;
		                        res.setHeader( 'Content-disposition', 'attachment; filename="' + account.currency_id + ' ' + statement.year + ( '0' + statement.month ).slice( -2 ) + '.pdf"' );
		                        res.setHeader( 'Content-type', 'application/pdf' );
		                        var filestream = fs.createReadStream( path );
		                        filestream.pipe( res );
		
		                        filestream.on( 'end', function(){
		                            return next();
		                        } );
		                    }
                        }
                	} );
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};
