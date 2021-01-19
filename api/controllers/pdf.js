


var Sequelize = require( 'sequelize' );
var db = require( '../models' );
var moment = require( 'moment-timezone' );
var math = require( 'mathjs' );
var _ = require( 'lodash' );
var request = require( 'request' );

var Fund = db.Fund;
var Node = db.Node;
var Account = db.Account;
var Project = db.Project;
var Invoice = db.Invoice;
var InvoiceItem = db.InvoiceItem;
var Currency = db.Currency;

var notifier = require( '../lib/akx.notifier.js' );
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var pdfConfig = require( '../config/config.json').pdf_api;
var _this = this;


exports.handleError = function( err, req, res ){
    util.handleError( 'pdf', err, req, res );
};



exports.sendInvoice = function( req, res, next ){
    req.assert( 'invoice_id', 'isString' );

    if( !_.isEmpty( req.validationErrors ) ){
        util.handleValidationErrors( req, res );
        return next();
    }
    else{
        Invoice.find( {
            where: {
                id: req.params.invoice_id,
                company_id: req.user.company_id
            },
            include: [
                { model: InvoiceItem },
                {
                    model: Node,
                    include: {
                        model: Fund
                    }
                }
            ]
        } )
            .then( function( invoice ){
                if( !invoice ){
                    res.send( 404 );
                    return next();
                }
                else{
                    request.post( {
                        url: pdfConfig.host + '/pdfs',
                        json: {
                            template_name: 'invoice',
                            data: {
                                invoice: invoice
                            }
                        }
                    }, function( err, response, pdfBody ){
                        if( err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else{
                            if( response.statusCode !== 200 && response.statusCode !== 201 ){
                                res.send( 400, { errors: [ 'Error getting pdf' ] } );
                                return next();
                            }
                            else{
                                res.send( 200, { invoice: invoice } );
                                return next();
                            }
                        }
                    } );
                }
            } )
            .catch( function( err ){
                _this.handleError( err, req, res );
                return next();
            } );
    }
};
