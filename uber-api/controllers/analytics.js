var Sequelize = require( 'sequelize' );
var db = require( '../models' );
var db_uber = require( '../models_uber' );
var moment = require( 'moment-timezone' );
var math = require( 'mathjs' );
var _ = require( 'lodash' );
var Account = db.Account;
var Node = db.Node;
var Project = db.Project;
var Invoice = db.Invoice;
var Transaction = db.Transaction;
var Currency = db.Currency;
var Company = db.Company;
var UberBankFeeRate = db_uber.UberBankFeeRate;

var pdfConfig = require( '../config/config.json' ).pdf_api;
var request = require( 'request' );


var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'transaction', err, req, res );
};





exports.action = function( req, res, next ){
    switch( req.params.type ){
        case 'transactions-invoice':
            exports.transactionsInvoice( req, res, next );
            break;
        case 'transactions-fee':
            exports.transactionsFee( req, res, next );
            break;
        case 'transactions-wire-in':
            exports.transactionsWireIn( req, res, next );
            break;
        case 'transactions-wire-out':
            exports.transactionsWireOut( req, res, next );
            break;
        case 'transactions-internal':
            exports.transactionsInternal( req, res, next );
            break;
        case'fee-totals':
            exports.feeTotals( req, res, next );
            break;
        case'cop':
            exports.cop( req, res, next );
            break;
        case'transactions-fx-volume':
            exports.fxVolume( req, res, next );
            break;
        case'ip-map':
            exports.ipMap( req, res, next );
            break;
        case'company-fee':
            exports.companyFeeTotals( req, res, next );
            break;
        case 'network':
            exports.network( req, res, next );
            break;
        case 'snapshot-fee-totals':
            exports.snapshot_feeTotals( req, res, next );
            break;
        case 'snapshot-ytd':
            exports.snapshot_ytd( req, res, next );
            break;
        case 'account-balance-history':
            exports.accountBalanceHistory( req, res, next );
            break;
        default:
            res.send( 501 );
            return next();
    }
};



exports.accountBalanceHistory = function( req, res, next ){
    var startDate = req.params.from_date;
    var endDate = req.params.to_date;

    if( !_.isEmpty( req.params.company_id ) ){
        var accounts = [];
        return Account.findAll( { where: { company_id: req.params.company_id } } ).then( function( accountsFound ){
            accounts = accountsFound;
            var promises = [];
            _.forEach( accounts, function( account ){
                promises.push( db.sequelize.query( "SELECT amount, DATE(updated_at) as day FROM `transactions` WHERE `from_account_id`= '" + account.id + "' AND  `type` = 7 AND `status`=1 AND (`updated_at` BETWEEN '" + startDate + "' AND '" + endDate + "') ORDER BY `day`" ) );
            } );

            return Promise.all( promises );
        } ).then( function( results ){
            var data = [];

            _.forEach( results, function( result, indx ){
                if( !_.isEmpty( result ) ){
                    var dataObj = {
                        name: 'Account: ' + accounts[ indx ].name,
                        data: []
                    };

                    for( var i = 0; i < result.length; i++ ){
                        dataObj.data.push( [ result[ i ].day, result[ i ].amount ] );
                    }
                    data.push( dataObj );
                }
            } );

            res.send( 200, { data: data } );
            return next();
        } ).catch( function( err ){
            _this.handleError( err, req, res );
            return next();
        } );
    }
    else{
        res.send( 400, { errors: [ 'Company id does not exist' ] } );
        return next();
    }
};




exports.transactionsInvoice = function( req, res, next ){
    var startDate = req.params.from_date;
    var endDate = req.params.to_date;
    var currency_id = req.params.currency_id;
    var chainer = new db.Sequelize.Utils.QueryChainer;
    if( req.params.company_id ){
        var company_id = req.params.company_id;
        chainer.add( db.sequelize.query( "SELECT DATE(transactions.updated_at) as day, SUM(amount) as amount FROM transactions JOIN accounts ON to_account_id = accounts.id WHERE accounts.company_id = '" + company_id + "'AND transactions.status = 1 AND transactions.type = 1  AND transactions.currency_id = '" + currency_id + "' AND (transactions.updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') GROUP BY DATE(transactions.updated_at)" ) );
    }
    else{
        chainer.add( db.sequelize.query( "SELECT DATE(updated_at) as day, SUM(amount) as amount FROM transactions WHERE status = 1 AND type = 1 AND currency_id = '" + currency_id + "' AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') GROUP BY DATE(updated_at)" ) );
    }
    chainer.run().done( function( err, results ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else{
            var accountCount = 0;
            var data = [];
            _.forEach( results, function( result ){
                data.push( {
                    name: 'Invoice Volume In ' + currency_id,
                    data: []
                } );
                for( var i = 0; i < 1; i++ ){
                    results[ accountCount + i ].forEach( function( item ){
                        data[ accountCount + i ].data.push( [ item.day, item.amount ] );
                    } );
                }
                accountCount += 1;
            } );

            res.send( 200, { data: data } );
            return next();
        }
    } );
};



exports.transactionsFee = function( req, res, next ){
    var startDate = req.params.from_date;
    var endDate = req.params.to_date;
    var currency_id = req.params.currency_id;
    var chainer = new db.Sequelize.Utils.QueryChainer;
    chainer.add( db.sequelize.query( "SELECT DATE(updated_at) as day, SUM(amount) as amount FROM transactions WHERE status = 1 AND type = 3 AND currency_id = '" + currency_id + "' AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') GROUP BY DATE(updated_at)" ) );
    chainer.run().done( function( err, results ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else{
            var accountCount = 0;
            var data = [];
            _.forEach( results, function( result ){
                data.push( {
                    name: 'Fee Volume In ' + currency_id,
                    data: []
                } );
                for( var i = 0; i < 1; i++ ){
                    results[ accountCount + i ].forEach( function( item ){
                        data[ accountCount + i ].data.push( [ item.day, item.amount ] );
                    } );
                }
                accountCount += 1;
            } );
            res.send( 200, { data: data } );
            return next();
        }
    } );
};



exports.transactionsWireIn = function( req, res, next ){
    var startDate = req.params.from_date;
    var endDate = req.params.to_date;
    var currency_id = req.params.currency_id;
    var chainer = new db.Sequelize.Utils.QueryChainer;
    if( req.params.company_id ){
        var company_id = req.params.company_id;
        chainer.add( db.sequelize.query( "SELECT DATE(updated_at) as day, SUM(amount) as amount FROM wires WHERE status = 2 AND type = 1 AND currency_id = '" + currency_id + "' AND company_id = '" + company_id + "'AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') GROUP BY DATE(updated_at)" ) );
    }
    else{
        chainer.add( db.sequelize.query( "SELECT DATE(updated_at) as day, SUM(amount) as amount FROM wires WHERE status = 2 AND type = 1 AND currency_id = '" + currency_id + "' AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') GROUP BY DATE(updated_at)" ) );
    }
    chainer.run().done( function( err, results ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else{
            var accountCount = 0;
            var data = [];
            _.forEach( results, function( result ){
                data.push( {
                    name: 'Wires In In ' + currency_id,
                    data: []
                } );
                for( var i = 0; i < 1; i++ ){
                    results[ accountCount + i ].forEach( function( item ){
                        data[ accountCount + i ].data.push( [ item.day, item.amount ] );
                    } );
                }
                accountCount += 1;
            } );
            res.send( 200, { data: data } );
            return next();
        }
    } );
};



exports.transactionsWireOut = function( req, res, next ){
    var startDate = req.params.from_date;
    var endDate = req.params.to_date;
    var currency_id = req.params.currency_id;
    var chainer = new db.Sequelize.Utils.QueryChainer;
    if( req.params.company_id ){
        var company_id = req.params.company_id;
        chainer.add( db.sequelize.query( "SELECT DATE(updated_at) as day, SUM(amount) as amount FROM wires WHERE status = 2 AND type = 0 AND currency_id = '" + currency_id + "' AND company_id = '" + company_id + "' AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') GROUP BY DATE(updated_at)" ) );
    }
    else{
        chainer.add( db.sequelize.query( "SELECT DATE(updated_at) as day, SUM(amount) as amount FROM wires WHERE status = 2 AND type = 0 AND currency_id = '" + currency_id + "' AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') GROUP BY DATE(updated_at)" ) );
    }
    chainer.run().done( function( err, results ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else{
            var accountCount = 0;
            var data = [];
            _.forEach( results, function( result ){
                data.push( {
                    name: 'Wires Out In ' + currency_id,
                    data: []
                } );
                for( var i = 0; i < 1; i++ ){
                    results[ accountCount + i ].forEach( function( item ){
                        data[ accountCount + i ].data.push( [ item.day, item.amount ] );
                    } );
                }
                accountCount += 1;
            } );

            res.send( 200, { data: data } );
            return next();
        }
    } );
};



exports.transactionsInternal = function( req, res, next ){
    var startDate = req.params.from_date;
    var endDate = req.params.to_date;
    var currency_id = req.params.currency_id;
    var chainer = new db.Sequelize.Utils.QueryChainer;
    chainer.add( db.sequelize.query( "SELECT DATE(updated_at) as day, SUM(amount) as amount FROM wires WHERE status = 2 AND type = 2 AND currency_id = '" + currency_id + "' AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') GROUP BY DATE(updated_at)" ) );
    chainer.run().done( function( err, results ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else{
            var accountCount = 0;
            var data = [];
            _.forEach( results, function( result ){

                data.push( {
                    name: 'Internal Transactions In ' + currency_id,
                    data: []
                } );
                for( var i = 0; i < 1; i++ ){
                    results[ accountCount + i ].forEach( function( item ){
                        data[ accountCount + i ].data.push( [ item.day, item.amount ] );
                    } );
                }
                accountCount += 1;
            } );
            res.send( 200, { data: data } );
            return next();
        }
    } );
};



exports.feeTotals = function( req, res, next ){
    UberBankFeeRate.getWireCosts()
        .then( function( wireCosts ){
            Currency.findAll( {
                order: "FIELD(currencies.id, 'USD','EUR','GBP')"
            } )
                .done( function( err, currencies ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else{
                        var startDate = req.params.from_date;
                        var endDate = req.params.to_date;
                        var chainer = new db.Sequelize.Utils.QueryChainer;
                        _.forEach( currencies, function( currency ){

                            //wire in Domestic count amount and fee
                            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL, 0, SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE status = 2 AND type = 1 AND method = 0 AND bank_country = 'US' AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id='" + currency.id + "'" ) );

                            //Wire In International count and amount and fee
                            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL, 0, SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE status = 2 AND method = 0 AND type = 1 AND bank_country <> 'US' AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id='" + currency.id + "'" ) );

                            //Wire Out Domestic count amount and fee
                            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE bank_country = 'US' AND speedwire = 0 AND status = 2 AND method = 0 AND type = 0 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND  currency_id='" + currency.id + "'" ) );

                            //Wire Out Domestic Speedwire count and amount and fee
                            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE bank_country = 'US' AND speedwire = 1 AND status = 2 AND type = 0 AND method = 0 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id = '" + currency.id + "'" ) );

                            //Wire Out International count and amount and fee
                            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE bank_country <> 'US' AND speedwire = 0 AND status = 2 AND type = 0 AND method = 0 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id = '" + currency.id + "'" ) );

                            //Wire Out International Speedwire count and amount and fee
                            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE bank_country <> 'US' AND speedwire = 1 AND status = 2 AND type = 0 AND method = 0 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id = '" + currency.id + "'" ) );

                            //ACH in Domestic count and amount and fee
                            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE bank_country = 'US' AND method = 1 AND status = 2 AND type = 1 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id = '" + currency.id + "'" ) );

                            //ACH in International count and amount and fee
                            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE bank_country <> 'US' AND method = 1 AND status = 2 AND type = 1 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id = '" + currency.id + "'" ) );

                            //ACH out Domestic count and amount and fee
                            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE bank_country = 'US' AND method = 1 AND status = 2 AND type = 0 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id = '" + currency.id + "'" ) );

                            //ACH out International count and amount and fee
                            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE bank_country <> 'US' AND method = 1 AND status = 2 AND type = 0 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id = '" + currency.id + "'" ) );

                            //invoice total count and amount
                            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount FROM transactions WHERE status = 1 AND type = 1 AND model='invoice' AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id ='" + currency.id + "'" ) );

                            //invoice fee
                            chainer.add( db.sequelize.query( "SELECT IF(SUM(amount) IS NULL,0,SUM(amount)) as fee FROM transactions WHERE status = 1 AND type = 3 AND model='invoice' AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id ='" + currency.id + "'" ) );

                            //foreign exchange count and amount
                            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(base_amount) IS NULL,0,SUM(base_amount)) as amount FROM fx_requests WHERE status = 2 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND base_currency_id ='" + currency.id + "'" ) );

                            //fx fee
                            chainer.add( db.sequelize.query( "SELECT IF(SUM(amount) IS NULL,0,SUM(amount)) as fee FROM transactions WHERE status = 1 AND type = 3 AND model='fx-request' AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id ='" + currency.id + "'" ) );

                            //refund count and amount
                            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount FROM transactions JOIN accounts ON transactions.from_account_id = accounts.id WHERE accounts.company_id = 'masterco-mpan-yisa-kiri-xtheidislong'  AND transactions.status = 1 AND transactions.type = 3 AND (transactions.updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND transactions.currency_id ='" + currency.id + "'" ) );

                            //total wire in count amount and fee
                            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE status = 2 AND type = 1 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id='" + currency.id + "'" ) );

                            //total wire out count amount and fee
                            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE status = 2 AND type = 0 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id='" + currency.id + "'" ) );

                            //internal transfer count and amount fee
                            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE method = 2 AND status = 2 AND type = 2 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id ='" + currency.id + "'" ) );

                            //charges count and amount fee
                            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount FROM transactions WHERE model='charge' AND status = 1 AND type = 3 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id ='" + currency.id + "'" ) );


                            // //speed wire domestic fee
                            // chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE bank_country = 'US' AND speedwire = 1 AND status = 2 AND type = 0 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id='" + currency.id + "'" ) );
                            // //speed wire international
                            // chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE bank_country <> 'US' AND speedwire = 1 AND status = 2 AND type = 0 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id='" + currency.id + "'" ) );


                            // //internal transfer count and amount fee
                            // chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE method = 2 AND status = 2 AND type = 2 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id ='" + currency.id + "'" ) );
                            // //foreign exchange fee count and amount
                            // chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(base_amount) IS NULL,0,SUM(b ase_amount)) as amount FROM fx_requests WHERE status = 2 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND base_currency_id ='" + currency.id + "'" ) );
                            // //fx fee
                            // chainer.add( db.sequelize.query( "SELECT IF(SUM(amount) IS NULL,0,SUM(amount)) as fee FROM transactions WHERE status = 1 AND type = 3 AND model='fx-request' AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id ='" + currency.id + "'" ) );
                            // //refund count and amount
                            // chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount FROM transactions JOIN accounts ON transactions.from_account_id = accounts.id WHERE accounts.company_id = 'masterco-mpan-yisa-kiri-xtheidislong'  AND transactions.status = 1 AND transactions.type = 3 AND (transactions.updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND transactions.currency_id ='" + currency.id + "'" ) );
                        } );
                        chainer.run().done( function( err, results ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else{
                                var data = [];
                                var idx = 0;

                                _.forEach( currencies, function( currency ){
                                    var perWireInDomCost = null;
                                    var perWireInIntlCost = null;
                                    var perWireOutDomCost = null;
                                    var perWireOutIntlCost = null;
                                    var achWireInDomCost = null;
                                    var achWireInIntlCost = null;
                                    var achWireOutDomCost = null;
                                    var achWireOutIntlCost = null;

                                    if( currency === 'USD' ){
                                        perWireInDomCost = wireCosts.usd_in_dom;
                                        perWireInIntlCost = wireCosts.usd_in_intl;
                                        perWireOutDomCost = wireCosts.usd_out_dom;
                                        perWireOutIntlCost = wireCosts.usd_out_intl;
                                        achWireInDomCost = wireCosts.ach_in_usd_dom_rate;
                                        achWireInIntlCost = wireCosts.ach_in_usd_intl_rate;
                                        achWireOutDomCost = wireCosts.ach_out_usd_dom_rate;
                                        achWireOutIntlCost = wireCosts.ach_out_usd_intl_rate;
                                    }
                                    else{
                                        perWireInDomCost = wireCosts.mca_in_dom;
                                        perWireInIntlCost = wireCosts.mca_in_intl;
                                        perWireOutDomCost = wireCosts.mca_out_dom;
                                        perWireOutIntlCost = wireCosts.mca_out_intl;
                                        achWireInDomCost = wireCosts.ach_in_mca_dom_rate;
                                        achWireInIntlCost = wireCosts.ach_in_mca_intl_rate;
                                        achWireOutDomCost = wireCosts.ach_out_mca_dom_rate;
                                        achWireOutIntlCost = wireCosts.ach_out_mca_intl_rate;
                                    }

                                    data.push( {
                                        currency: currency.id,
                                        symbol: currency.symbol,
                                        wire_in_domestic_count: results[ idx ][ 0 ].count,
                                        wire_in_domestic_amount: results[ idx ][ 0 ].amount,
                                        wire_in_domestic_fee: results[ idx ][ 0 ].fee,
                                        wire_in_domestic_cost: results[ idx ][ 0 ].count * perWireInDomCost,
                                        wires_in_international_count: results[ idx + 1 ][ 0 ].count,
                                        wires_in_international_amount: results[ idx + 1 ][ 0 ].amount,
                                        wires_in_international_fee: results[ idx + 1 ][ 0 ].fee,
                                        wires_in_international_cost: results[ idx + 1 ][ 0 ].count * perWireInIntlCost,
                                        wires_out_domestic_count: results[ idx + 2 ][ 0 ].count,
                                        wires_out_domestic_amount: results[ idx + 2 ][ 0 ].amount,
                                        wires_out_domestic_fee: results[ idx + 2 ][ 0 ].fee,
                                        wires_out_domestic_cost: results[ idx + 2 ][ 0 ].count * perWireOutDomCost,
                                        wires_out_domestic_speedwire_count: results[ idx + 3 ][ 0 ].count,
                                        wires_out_domestic_speedwire_amount: results[ idx + 3 ][ 0 ].amount,
                                        wires_out_domestic_speedwire_fee: results[ idx + 3 ][ 0 ].fee,
                                        wires_out_domestic_speedwire_cost: results[ idx + 3 ][ 0 ].count * perWireOutDomCost,
                                        wires_out_international_count: results[ idx + 4 ][ 0 ].count,
                                        wires_out_international_amount: results[ idx + 4 ][ 0 ].amount,
                                        wires_out_international_fee: results[ idx + 4 ][ 0 ].fee,
                                        wires_out_international_cost: results[ idx + 4 ][ 0 ].count * perWireOutIntlCost,
                                        wires_out_international_speedwire_count: results[ idx + 5 ][ 0 ].count,
                                        wires_out_international_speedwire_amount: results[ idx + 5 ][ 0 ].amount,
                                        wires_out_international_speedwire_fee: results[ idx + 5 ][ 0 ].fee,
                                        wires_out_international_speedwire_cost: results[ idx + 5 ][ 0 ].count * perWireOutIntlCost,
                                        ach_in_domestic_count: results[ idx + 6 ][ 0 ].count,
                                        ach_in_domestic_amount: results[ idx + 6 ][ 0 ].amount,
                                        ach_in_domestic_fee: results[ idx + 6 ][ 0 ].fee,
                                        ach_in_domestic_cost: results[ idx + 6 ][ 0 ].count * achWireInDomCost,
                                        ach_in_intl_count: results[ idx + 7 ][ 0 ].count,
                                        ach_in_intl_amount: results[ idx + 7 ][ 0 ].amount,
                                        ach_in_intl_fee: results[ idx + 7 ][ 0 ].fee,
                                        ach_in_intl_cost: results[ idx + 7 ][ 0 ].count * achWireInIntlCost,
                                        ach_out_domestic_count: results[ idx + 8 ][ 0 ].count,
                                        ach_out_domestic_amount: results[ idx + 8 ][ 0 ].amount,
                                        ach_out_domestic_fee: results[ idx + 8 ][ 0 ].fee,
                                        ach_out_domestic_cost: results[ idx + 8 ][ 0 ].count * achWireOutDomCost,
                                        ach_out_intl_count: results[ idx + 9 ][ 0 ].count,
                                        ach_out_intl_amount: results[ idx + 9 ][ 0 ].amount,
                                        ach_out_intl_fee: results[ idx + 9 ][ 0 ].fee,
                                        ach_out_intl_cost: results[ idx + 9 ][ 0 ].count * achWireOutIntlCost,
                                        invoices_count: results[ idx + 10 ][ 0 ].count,
                                        invoices_amount: results[ idx + 10 ][ 0 ].amount,
                                        invoices_fee: results[ idx + 11 ][ 0 ].fee,
                                        fx_count: results[ idx + 12 ][ 0 ].count,
                                        fx_amount: results[ idx + 12 ][ 0 ].amount,
                                        fx_fee: results[ idx + 13 ][ 0 ].fee,
                                        fee_refund_count: results[ idx + 14 ][ 0 ].count,
                                        fee_refund_amount: results[ idx + 14 ][ 0 ].amount,
                                        wire_in_count: results[ idx + 15 ][ 0 ].count,
                                        wire_in_amount: results[ idx + 15 ][ 0 ].amount,
                                        wire_in_fee: results[ idx + 15 ][ 0 ].fee,
                                        wire_in_cost: results[ idx ][ 0 ].count * perWireInDomCost + results[ idx + 1 ][ 0 ].count * perWireInIntlCost + results[ idx + 6 ][ 0 ].count * achWireInDomCost + results[ idx + 7 ][ 0 ].count * achWireInIntlCost,
                                        wire_out_count: results[ idx + 16 ][ 0 ].count,
                                        wire_out_amount: results[ idx + 16 ][ 0 ].amount,
                                        wire_out_fee: results[ idx + 16 ][ 0 ].fee,
                                        wire_out_cost: results[ idx + 2 ][ 0 ].count * perWireOutDomCost + results[ idx + 3 ][ 0 ].count * perWireOutDomCost + results[ idx + 4 ][ 0 ].count * perWireOutIntlCost + results[ idx + 5 ][ 0 ].count * perWireOutIntlCost + results[ idx + 8 ][ 0 ].count * achWireOutDomCost + results[ idx + 9 ][ 0 ].count * achWireOutIntlCost,
                                        internal_transfers_count: results[ idx + 17 ][ 0 ].count,
                                        internal_transfers_amount: results[ idx + 17 ][ 0 ].amount,
                                        internal_transfers_fee: results[ idx + 17 ][ 0 ].fee,
                                        charge_count: results[ idx + 18 ][ 0 ].count,
                                        charge_amount: results[ idx + 18 ][ 0 ].amount
                                    } );


                                    idx += 19;
                                } );

                                res.send( 200, { data: data } );
                                return next();
                            }
                        } );
                    }
                } );
        } );
};




exports.cop = function( req, res, next ){
    db.sequelize.query(
        "SELECT account_details.currency_id, currencies.symbol, SUM(balance+balance_hold+points_out+pending_out) as platform_balance" +
        " FROM (" +
        " SELECT accounts.id,accounts.currency_id,accounts.company_id,accounts.balance,accounts.balance_hold," +
        "( SELECT IFNULL(SUM(n2.points_guarantee)+SUM(n2.points_cash),0) as amount FROM nodes n1 INNER JOIN nodes n2 ON n1.id = n2.parent_id WHERE n1.account_id= accounts.id ) as points_out," +
        "( SELECT IFNULL(SUM(amount),0) as amount FROM transactions WHERE from_account_id=accounts.id AND status=0 ) as pending_out" +
        " FROM accounts) as account_details" +
        " JOIN currencies ON account_details.currency_id = currencies.id" +
        " GROUP BY account_details.currency_id, currencies.symbol" +
        " ORDER BY FIELD(accounts.account_details.currency_id, 'USD','EUR','GBP')"
    )
        .done( function( err, results ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                res.send( 200, { data: results } );
                return next();
            }
        } );
};



exports.fxVolume = function( req, res, next ){
    var startDate = req.params.from_date;
    var endDate = req.params.to_date;
    var currency_id = req.params.base_currency_id;
    var chainer = new db.Sequelize.Utils.QueryChainer;
    chainer.add( db.sequelize.query( "SELECT DATE(updated_at) as day, SUM(base_amount) as amount FROM fx_requests WHERE status = 2  AND base_currency_id = '" + currency_id + "' AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') GROUP BY DATE(updated_at)" ) );
    chainer.add( db.sequelize.query( "SELECT counter_currency_id, DATE(updated_at) as day, SUM(base_amount) as amount FROM fx_requests WHERE status = 2  AND base_currency_id = '" + currency_id + "' AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') GROUP BY DATE(updated_at), counter_currency_id" ) );
    chainer.run().done( function( err, results ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else{
            var count = 0;
            var data = [];
            var dataByCurrencies = {};

            data.push( {
                name: 'FX ' + currency_id + ' total',
                data: []
            } );
            results[ 0 ].forEach( function( item ){
                data[ 0 ].data.push( [ item.day, item.amount ] );
            } );
            _.forEach( results[ 1 ], function( item ){
                if( dataByCurrencies.hasOwnProperty( item.counter_currency_id ) ){
                    dataByCurrencies[ item.counter_currency_id ].push( [ item.day, item.amount ] );
                }
                else{
                    dataByCurrencies[ item.counter_currency_id ] = [ [ item.day, item.amount ] ];
                }
            } );
            _.forEach( dataByCurrencies, function( value, key ){
                data.push( {
                    name: 'FX ' + currency_id + ' to ' + key,
                    data: value
                } );
            } );
            res.send( 200, { data: data } );
            return next();
        }

    } );
};




exports.ipMap = function( req, res, next ){
    var startDate = req.params.from_date;
    var endDate = req.params.to_date;
    var chainer = new db.Sequelize.Utils.QueryChainer;
    chainer.add( db.sequelize.query( "SELECT longLat.longitude, longLat.latitude, (SELECT GROUP_CONCAT(DISTINCT ' ', users.first_name, ' ', users.last_name,' | ',users.email, ' | XYZ ', companies.account_number, ' ', companies.name) " +
        "FROM access_logs JOIN users ON access_logs.user_id = users.id JOIN companies ON users.company_id = companies.id WHERE access_logs.longitude=longLat.longitude AND access_logs.latitude=longLat.latitude AND access_logs.updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') " +
        "as users    FROM (SELECT DISTINCT longitude,latitude FROM access_logs WHERE access_logs.updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') longLat    WHERE longLat.longitude IS NOT NULL AND longLat.latitude IS NOT NULL " ) );
    chainer.run().done( function( err, results ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next()
        }
        else{
            var count = 0;
            var data = [];
            _.forEach( results, function( result ){
                data.push( {
                    name: 'Map Ips',
                    data: []
                } );
                for( var i = 0; i < 1; i++ ){
                    results[ count + i ].forEach( function( item ){
                        data[ count + i ].data.push( { users: item.users, longitude: item.longitude, latitude: item.latitude } );
                    } );
                }
                count += 1;
            } );
            res.send( 200, { data: data } );
            return next();
        }
    } );
};


exports.companyFeeTotals = function( req, res, next ){
    var startDate = req.params.from_date;
    var endDate = req.params.to_date;
    var currency_id = req.params.currency_id;
    var company_id = req.params.company_id;
    var chainer = new db.Sequelize.Utils.QueryChainer;
    Currency.find( {
        where: {
            id: currency_id
        }
    } ).done( function( err, currency ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next()
        }
        else{
            //invoice total count and amount
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount FROM transactions JOIN accounts ON (to_account_id = accounts.id OR from_account_id = accounts.id) WHERE accounts.company_id = '" + company_id + "' AND transactions.status = 1 AND transactions.type = 1 AND transactions.model='invoice' AND (transactions.updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND transactions.currency_id ='" + currency_id + "' " ) );
            //invoice total fee
            chainer.add( db.sequelize.query( "SELECT IF(SUM(amount) IS NULL,0,SUM(amount)) as fee FROM transactions JOIN accounts ON from_account_id = accounts.id WHERE accounts.company_id = '" + company_id + "' AND transactions.status = 1 AND transactions.type = 3 AND transactions.model='invoice' AND (transactions.updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND transactions.currency_id ='" + currency_id + "'" ) );
            ////wire in count amount and fee
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE company_id = '" + company_id + "' AND status = 2 AND type = 1 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id='" + currency_id + "'" ) );
            ////domestic count amount and fee
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE company_id = '" + company_id + "' AND status = 2 AND type = 1 AND bank_country = 'US' AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id='" + currency_id + "'" ) );
            //international count and amount and fee
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE company_id = '" + company_id + "' AND status = 2 AND type = 1 AND bank_country <> 'US' AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id='" + currency_id + "'" ) );
            //wire out count amount and fee
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE company_id = '" + company_id + "' AND status = 2 AND type = 0 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id='" + currency_id + "'" ) );
            //domestic count amount and fee
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE company_id = '" + company_id + "' AND bank_country = 'US' AND speedwire = 0 AND status = 2 AND type = 0 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id='" + currency_id + "'" ) );
            //international count and amount and fee
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE company_id = '" + company_id + "' AND bank_country <> 'US' AND speedwire = 0 AND status = 2 AND type = 0 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id='" + currency_id + "'" ) );
            //speed wire domestic fee
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE company_id = '" + company_id + "' AND bank_country = 'US' AND speedwire = 1 AND status = 2 AND type = 0 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id='" + currency_id + "'" ) );
            //speed wire international
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE company_id = '" + company_id + "' AND bank_country <> 'US' AND speedwire = 1 AND status = 2 AND type = 0 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id='" + currency_id + "'" ) );
            //internal transfer count and amount fee
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE company_id = '" + company_id + "' AND method = 2 AND status = 2 AND type = 2 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id ='" + currency_id + "'" ) );
            ////foreign exchange fee count and amount
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(base_amount) IS NULL,0,SUM(base_amount)) as amount FROM fx_requests WHERE company_id = '" + company_id + "' AND status = 2 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND base_currency_id ='" + currency_id + "'" ) );
            //fx fee
            chainer.add( db.sequelize.query( "SELECT IF(SUM(amount) IS NULL,0,SUM(amount)) as fee FROM transactions JOIN accounts ON from_account_id = accounts.id WHERE accounts.company_id = '" + company_id + "' AND transactions.status = 1 AND transactions.type = 3 AND transactions.model='fx-request' AND (transactions.updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND transactions.currency_id ='" + currency_id + "'" ) );
            //refund count and amount
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount FROM transactions JOIN accounts  ON transactions.to_account_id = accounts.id WHERE accounts.company_id = '" + company_id + "' AND transactions.status = 1 AND transactions.type = 3 AND (transactions.updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND transactions.currency_id ='" + currency_id + "'" ) );
            //bills total count and amount
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount FROM transactions JOIN accounts ON from_account_id = accounts.id WHERE accounts.company_id = '" + company_id + "' AND transactions.status = 1 AND transactions.type = 1 AND transactions.model='invoice' AND (transactions.updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND transactions.currency_id ='" + currency_id + "' " ) );
            //bills fee
            chainer.add( db.sequelize.query( "SELECT IF(SUM(transactions.amount) IS NULL,0,SUM(transactions.amount)) as fee FROM transactions JOIN accounts ON from_account_id = accounts.id JOIN transactions t2 ON transactions.parent_id = t2.id WHERE transactions.from_account_id = t2.from_account_id AND accounts.company_id = '" +company_id + "' AND transactions.status = 1 AND transactions.type = 3 AND transactions.model='invoice' AND (transactions.updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND transactions.currency_id ='" + currency_id + "'" ) );
            //invoices count and amount
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount FROM transactions JOIN accounts ON to_account_id = accounts.id WHERE accounts.company_id = '" + company_id + "' AND transactions.status = 1 AND transactions.type = 1 AND transactions.model='invoice' AND (transactions.updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND transactions.currency_id ='" + currency_id + "' " ) );
            //invoices fee
            chainer.add( db.sequelize.query( "SELECT IF(SUM(transactions.amount) IS NULL,0,SUM(transactions.amount)) as fee FROM transactions JOIN accounts ON from_account_id = accounts.id  JOIN transactions t2 ON transactions.parent_id = t2.id WHERE transactions.from_account_id = t2.to_account_id AND accounts.company_id = '" +company_id + "' AND transactions.status = 1 AND transactions.type = 3 AND transactions.model='invoice' AND (transactions.updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND transactions.currency_id ='" + currency_id + "'" ) );
            // charges
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(transactions.amount) IS NULL,0,SUM(transactions.amount)) as amount FROM transactions INNER JOIN charges ON transactions.model='charge' and transactions.model_id=charges.id WHERE charges.company_id = '" +company_id + "' AND transactions.status = 1 AND transactions.type = 3 AND (transactions.updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND transactions.currency_id ='" + currency.id + "'" ) );
            chainer.run().done( function( err, results ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{
                    var data = [];
                    var idx = 0;
                    data.push( {
                        currency: currency_id,
                        symbol: currency.symbol,
                        invoices_count: results[ idx ][ 0 ].count,
                        invoices_amount: results[ idx ][ 0 ].amount,
                        invoices_fee: results[ idx + 1 ][ 0 ].fee,
                        wires_in_count: results[ idx + 2 ][ 0 ].count,
                        wires_in_amount: results[ idx + 2 ][ 0 ].amount,
                        wires_in_fee: results[ idx + 2 ][ 0 ].fee,
                        wires_in_domestic_count: results[ idx + 3 ][ 0 ].count,
                        wires_in_domestic_amount: results[ idx + 3 ][ 0 ].amount,
                        wires_in_domestic_fee: results[ idx + 3 ][ 0 ].fee,
                        wires_in_international_count: results[ idx + 4 ][ 0 ].count,
                        wires_in_international_amount: results[ idx + 4 ][ 0 ].amount,
                        wires_in_international_fee: results[ idx + 4 ][ 0 ].fee,
                        wires_out_count: results[ idx + 5 ][ 0 ].count,
                        wires_out_amount: results[ idx + 5 ][ 0 ].amount,
                        wires_out_fee: results[ idx + 5 ][ 0 ].fee,
                        wires_out_domestic_count: results[ idx + 6 ][ 0 ].count,
                        wires_out_domestic_amount: results[ idx + 6 ][ 0 ].amount,
                        wires_out_domestic_fee: results[ idx + 6 ][ 0 ].fee,
                        wires_out_international_count: results[ idx + 7 ][ 0 ].count,
                        wires_out_international_amount: results[ idx + 7 ][ 0 ].amount,
                        wires_out_international_fee: results[ idx + 7 ][ 0 ].fee,
                        wires_out_domestic_speedwire_count: results[ idx + 8 ][ 0 ].count,
                        wires_out_domestic_speedwire_amount: results[ idx + 8 ][ 0 ].amount,
                        wires_out_domestic_speedwire_fee: results[ idx + 8 ][ 0 ].fee,
                        wires_out_international_speedwire_count: results[ idx + 9 ][ 0 ].count,
                        wires_out_international_speedwire_amount: results[ idx + 9 ][ 0 ].amount,
                        wires_out_international_speedwire_fee: results[ idx + 9 ][ 0 ].fee,
                        internal_transfers_count: results[ idx + 10 ][ 0 ].count,
                        internal_transfers_amount: results[ idx + 10 ][ 0 ].amount,
                        internal_transfers_fee: results[ idx + 10 ][ 0 ].fee,
                        fx_count: results[ idx + 11 ][ 0 ].count,
                        fx_amount: results[ idx + 11 ][ 0 ].amount,
                        fx_fee: results[ idx + 12 ][ 0 ].fee,
                        fee_refund_count: results[ idx + 13 ][ 0 ].count,
                        fee_refund_amount: results[ idx + 13 ][ 0 ].amount,
                        invoices_of_bills_count: results[ idx + 14 ][ 0 ].count,
                        invoices_of_bills_amount: results[ idx + 14 ][ 0 ].amount,
                        invoices_of_bills_fee: results[ idx + 15 ][ 0 ].fee,
                        invoices_of_invoices_count: results[ idx + 16 ][ 0 ].count,
                        invoices_of_invoices_amount: results[ idx + 16 ][ 0 ].amount,
                        invoices_of_invoices_fee: results[ idx + 17 ][ 0 ].fee,
                        charge_count: results[ idx + 18 ][ 0 ].count,
                        charge_amount: results[ idx + 18 ][ 0 ].amount
                    } );
                    idx += 19;
                    res.send( 200, { data: data } );
                    return next();
                }
            } );
        }
    } )
};

exports.network = function( req, res, next ){
    var startDate = req.params.from_date;
    var endDate = req.params.to_date;
    var data = [];
    db.sequelize.query( "SELECT SUM(amount) as amount, " +
        "CONCAT('XYZ', fc.account_number, ' ', fc.name) as fromCompany," +
        "CONCAT('XYZ', tc.account_number, ' ', tc.name) as toCompany " +
        "FROM transactions " +
        "LEFT JOIN accounts fa ON transactions.from_account_id = fa.id  " +
        "LEFT JOIN companies fc ON fa.company_id = fc.id " +
        "LEFT JOIN accounts ta ON transactions.to_account_id = ta.id " +
        "LEFT JOIN companies tc ON ta.company_id = tc.id WHERE transactions.status=1 " +
        "AND transactions.type NOT IN (2,7) " +
        "AND fc.name NOT LIKE '%akirix%' " +
        "AND tc.name NOT LIKE '%akirix%' " +
        "AND (transactions.updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') " +
        "AND IF(fc.account_number IS NULL, '', fc.account_number) != 'masterco-mpan-yisa-kiri-xtheidislong' AND IF(tc.account_number IS NULL, '', tc.account_number) != 'masterco-mpan-yisa-kiri-xtheidislong'" +
        "GROUP BY " +
        "CONCAT('XYZ', fc.account_number, ' ', fc.name), " +
        "CONCAT('XYZ', tc.account_number, ' ', tc.name)" )
        .done( function( err, results ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next()
            }
            else{
                var data = [];
                _.forEach( results, function( result ){
                    if( result.toCompany === null ){
                        result.toCompany = result.fromCompany;
                    }
                    if( result.fromCompany === null ){
                        result.fromCompany = result.toCompany;
                    }

                    var fromNode = _.find( data, function( o ){
                        return o.name === result.fromCompany;
                    } );

                    if( fromNode ){
                        fromNode.imports.push( result.toCompany );
                    }
                    else{
                        fromNode = { name: result.fromCompany, imports: [ result.toCompany ] };
                        data.push( fromNode );
                    }

                    var toNode = _.find( data, function( o ){
                        return o.name === result.toCompany;
                    } );
                    if( !toNode ){
                        toNode = { name: result.toCompany, imports: [] };
                        data.push( toNode );
                    }
                } );

                res.send( 200, { data: data } );
                return next();
            }
        } )
};

exports.snapshot_feeTotals = function( req, res, next ){
    Currency.findAll( {
        order: "FIELD(currencies.id, 'USD','EUR','GBP')"
    } ).then( function( currencies ){

        var startDate = req.params.from_date;
        var endDate = req.params.to_date;

        var lyStartDate = moment( startDate ).subtract( 1, 'years' ).format( 'YYYY-MM-DD HH:MM:SS' );
        var lyEndDate = moment( endDate ).subtract( 1, 'years' ).format( 'YYYY-MM-DD HH:MM:SS' );

        var chainer = new db.Sequelize.Utils.QueryChainer;
        _.forEach( currencies, function( currency ){

            //wire in Domestic count amount and fee
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL, 0, SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE status = 2 AND type = 1 AND method IN (0,1) AND bank_country = 'US' AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id='" + currency.id + "'" ) );

            //Wire In International count and amount and fee
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL, 0, SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE status = 2 AND type = 1 AND method IN (0,1) AND bank_country <> 'US' AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id='" + currency.id + "'" ) );

            //Wire Out Domestic count amount and fee
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL, 0, SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE status = 2 AND type = 0 AND method IN (0,1) AND bank_country = 'US' AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND  currency_id='" + currency.id + "'" ) );

            //Wire Out International count and amount and fee
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL, 0, SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE status = 2 AND type = 0 AND method IN (0,1) AND bank_country <> 'US' AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id = '" + currency.id + "'" ) );

            //invoice total count and amount
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount FROM transactions WHERE status = 1 AND type = 1 AND model='invoice' AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id ='" + currency.id + "'" ) );

            //invoice fee
            chainer.add( db.sequelize.query( "SELECT IF(SUM(amount) IS NULL,0,SUM(amount)) as fee FROM transactions WHERE status = 1 AND type = 3 AND model='invoice' AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id ='" + currency.id + "'" ) );

            //foreign exchange count and amount
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(base_amount) IS NULL,0,SUM(base_amount)) as amount FROM fx_requests WHERE status = 2 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND base_currency_id ='" + currency.id + "'" ) );

            //fx fee
            chainer.add( db.sequelize.query( "SELECT IF(SUM(amount) IS NULL,0,SUM(amount)) as fee FROM transactions WHERE status = 1 AND type = 3 AND model='fx-request' AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id ='" + currency.id + "'" ) );

            //refund count and amount
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount FROM transactions JOIN accounts ON transactions.from_account_id = accounts.id WHERE accounts.company_id = 'masterco-mpan-yisa-kiri-xtheidislong'  AND transactions.status = 1 AND transactions.type = 3 AND (transactions.updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND transactions.currency_id ='" + currency.id + "'" ) );

            //total wire in count amount and fee
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE status = 2 AND type = 1 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id='" + currency.id + "'" ) );

            //total wire out count amount and fee
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE status = 2 AND type = 0 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id='" + currency.id + "'" ) );

            //internal transfer count and amount fee
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE method = 2 AND status = 2 AND type = 2 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id ='" + currency.id + "'" ) );


            //ly numbers

            //wire in Domestic count amount and fee
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL, 0, SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE status = 2 AND type = 1 AND method IN (0,1) AND bank_country = 'US' AND (updated_at BETWEEN '" + lyStartDate + "' AND '" + lyEndDate + "') AND currency_id='" + currency.id + "'" ) );

            //Wire In International count and amount and fee
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL, 0, SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE status = 2 AND type = 1 AND method IN (0,1) AND bank_country <> 'US' AND (updated_at BETWEEN '" + lyStartDate + "' AND '" + lyEndDate + "') AND currency_id='" + currency.id + "'" ) );

            //Wire Out Domestic count amount and fee
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL, 0, SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE status = 2 AND type = 0 AND method IN (0,1) AND bank_country = 'US' AND (updated_at BETWEEN '" + lyStartDate + "' AND '" + lyEndDate + "') AND  currency_id='" + currency.id + "'" ) );

            //Wire Out International count and amount and fee
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL, 0, SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE status = 2 AND type = 0 AND method IN (0,1) AND bank_country <> 'US' AND (updated_at BETWEEN '" + lyStartDate + "' AND '" + lyEndDate + "') AND currency_id = '" + currency.id + "'" ) );

            //invoice total count and amount
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount FROM transactions WHERE status = 1 AND type = 1 AND model='invoice' AND (updated_at BETWEEN '" + lyStartDate + "' AND '" + lyEndDate + "') AND currency_id ='" + currency.id + "'" ) );

            //invoice fee
            chainer.add( db.sequelize.query( "SELECT IF(SUM(amount) IS NULL,0,SUM(amount)) as fee FROM transactions WHERE status = 1 AND type = 3 AND model='invoice' AND (updated_at BETWEEN '" + lyStartDate + "' AND '" + lyEndDate + "') AND currency_id ='" + currency.id + "'" ) );

            //foreign exchange count and amount
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(base_amount) IS NULL,0,SUM(base_amount)) as amount FROM fx_requests WHERE status = 2 AND (updated_at BETWEEN '" + lyStartDate + "' AND '" + lyEndDate + "') AND base_currency_id ='" + currency.id + "'" ) );

            //fx fee
            chainer.add( db.sequelize.query( "SELECT IF(SUM(amount) IS NULL,0,SUM(amount)) as fee FROM transactions WHERE status = 1 AND type = 3 AND model='fx-request' AND (updated_at BETWEEN '" + lyStartDate + "' AND '" + lyEndDate + "') AND currency_id ='" + currency.id + "'" ) );

            //refund count and amount
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount FROM transactions JOIN accounts ON transactions.from_account_id = accounts.id WHERE accounts.company_id = 'masterco-mpan-yisa-kiri-xtheidislong'  AND transactions.status = 1 AND transactions.type = 3 AND (transactions.updated_at BETWEEN '" + lyStartDate + "' AND '" + lyEndDate + "') AND transactions.currency_id ='" + currency.id + "'" ) );

            //total wire in count amount and fee
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE status = 2 AND type = 1 AND (updated_at BETWEEN '" + lyStartDate + "' AND '" + lyEndDate + "') AND currency_id='" + currency.id + "'" ) );

            //total wire out count amount and fee
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE status = 2 AND type = 0 AND (updated_at BETWEEN '" + lyStartDate + "' AND '" + lyEndDate + "') AND currency_id='" + currency.id + "'" ) );

            //internal transfer count and amount fee
            chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(SUM(fee) IS NULL,0,SUM(fee)) as fee FROM wires WHERE method = 2 AND status = 2 AND type = 2 AND (updated_at BETWEEN '" + lyStartDate + "' AND '" + lyEndDate + "') AND currency_id ='" + currency.id + "'" ) );

        } );
        chainer.run().then( function( results ){

            var data = [];
            var idx = 0;

            _.forEach( currencies, function( currency ){

                data.push( {
                    currency: currency.id,
                    symbol: currency.symbol,

                    wire_in_domestic_count: results[ idx ][ 0 ].count,
                    wire_in_domestic_amount: results[ idx ][ 0 ].amount,
                    wire_in_domestic_fee: results[ idx ][ 0 ].fee,

                    wires_in_international_count: results[ idx + 1 ][ 0 ].count,
                    wires_in_international_amount: results[ idx + 1 ][ 0 ].amount,
                    wires_in_international_fee: results[ idx + 1 ][ 0 ].fee,

                    wires_out_domestic_count: results[ idx + 2 ][ 0 ].count,
                    wires_out_domestic_amount: results[ idx + 2 ][ 0 ].amount,
                    wires_out_domestic_fee: results[ idx + 2 ][ 0 ].fee,

                    wires_out_international_count: results[ idx + 3 ][ 0 ].count,
                    wires_out_international_amount: results[ idx + 3 ][ 0 ].amount,
                    wires_out_international_fee: results[ idx + 3 ][ 0 ].fee,

                    invoices_count: results[ idx + 4 ][ 0 ].count,
                    invoices_amount: results[ idx + 4 ][ 0 ].amount,
                    invoices_fee: results[ idx + 5 ][ 0 ].fee,

                    fx_count: results[ idx + 6 ][ 0 ].count,
                    fx_amount: results[ idx + 6 ][ 0 ].amount,
                    fx_fee: results[ idx + 7 ][ 0 ].fee,

                    fee_refund_count: results[ idx + 8 ][ 0 ].count,
                    fee_refund_amount: results[ idx + 8 ][ 0 ].amount,

                    wire_in_count: results[ idx + 9 ][ 0 ].count,
                    wire_in_amount: results[ idx + 9 ][ 0 ].amount,
                    wire_in_fee: results[ idx + 9 ][ 0 ].fee,

                    wire_out_count: results[ idx + 10 ][ 0 ].count,
                    wire_out_amount: results[ idx + 10 ][ 0 ].amount,
                    wire_out_fee: results[ idx + 10 ][ 0 ].fee,

                    internal_transfers_count: results[ idx + 11 ][ 0 ].count,
                    internal_transfers_amount: results[ idx + 11 ][ 0 ].amount,
                    internal_transfers_fee: results[ idx + 11 ][ 0 ].fee,

                    //ly data

                    ly_wire_in_domestic_count: results[ idx + 12 ][ 0 ].count,
                    ly_wire_in_domestic_amount: results[ idx + 12 ][ 0 ].amount,
                    ly_wire_in_domestic_fee: results[ idx + 12 ][ 0 ].fee,

                    ly_wires_in_international_count: results[ idx + 13 ][ 0 ].count,
                    ly_wires_in_international_amount: results[ idx + 13 ][ 0 ].amount,
                    ly_wires_in_international_fee: results[ idx + 13 ][ 0 ].fee,

                    ly_wires_out_domestic_count: results[ idx + 14 ][ 0 ].count,
                    ly_wires_out_domestic_amount: results[ idx + 14 ][ 0 ].amount,
                    ly_wires_out_domestic_fee: results[ idx + 14 ][ 0 ].fee,

                    ly_wires_out_international_count: results[ idx + 15 ][ 0 ].count,
                    ly_wires_out_international_amount: results[ idx + 15 ][ 0 ].amount,
                    ly_wires_out_international_fee: results[ idx + 15 ][ 0 ].fee,

                    ly_invoices_count: results[ idx + 16 ][ 0 ].count,
                    ly_invoices_amount: results[ idx + 16 ][ 0 ].amount,
                    ly_invoices_fee: results[ idx + 17 ][ 0 ].fee,

                    ly_fx_count: results[ idx + 18 ][ 0 ].count,
                    ly_fx_amount: results[ idx + 18 ][ 0 ].amount,
                    ly_fx_fee: results[ idx + 19 ][ 0 ].fee,

                    ly_fee_refund_count: results[ idx + 20 ][ 0 ].count,
                    ly_fee_refund_amount: results[ idx + 20 ][ 0 ].amount,

                    ly_wire_in_count: results[ idx + 21 ][ 0 ].count,
                    ly_wire_in_amount: results[ idx + 21 ][ 0 ].amount,
                    ly_wire_in_fee: results[ idx + 21 ][ 0 ].fee,

                    ly_wire_out_count: results[ idx + 22 ][ 0 ].count,
                    ly_wire_out_amount: results[ idx + 22 ][ 0 ].amount,
                    ly_wire_out_fee: results[ idx + 22 ][ 0 ].fee,

                    ly_internal_transfers_count: results[ idx + 23 ][ 0 ].count,
                    ly_internal_transfers_amount: results[ idx + 23 ][ 0 ].amount,
                    ly_internal_transfers_fee: results[ idx + 23 ][ 0 ].fee

                } );
                idx += 24;
            } );

            res.send( 200, { data: data } );
            return next();

        } );
    } );
};

exports.snapshot_ytd = function( req, res, next ){
    Currency.findAll( {
        order: "FIELD(currencies.id, 'USD','EUR','GBP')"
    } ).then( function( currencies ){

        var startDate = moment().startOf( 'year' ).format( 'YYYY-MM-DD 00:00:00' );
        var endDate = req.params.to_date;
        var currency_id = req.params.currency_id;
        var chainer = new db.Sequelize.Utils.QueryChainer;
        _.forEach( currencies, function( currency ){
            chainer.add( db.sequelize.query( "SELECT DATE(updated_at) as day, SUM(amount) as amount FROM transactions WHERE status = 1 AND type = 3 AND currency_id = '" + currency.id + "' AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') GROUP BY DATE(updated_at)" ) );
        } );

        chainer.run().done( function( err, results ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                var accountCount = 0;
                var data = [];
                _.forEach( currencies, function( currency ){
                    data.push( {
                        name: currency.id + ' Fee Volume',
                        data: []
                    } );

                    for( var i = 0; i < 1; i++ ){
                        results[ accountCount + i ].forEach( function( item ){
                            data[ accountCount + i ].data.push( [ item.day, item.amount ] );
                        } );
                    }
                    accountCount += 1;
                } );
                res.send( 200, { data: data } );
                return next();
            }
        } );
    } );
};


exports.getPdf = function( req, res, next ){

    if( !_.isEmpty( req.validationErrors ) ){
        util.handleValidationErrors( req, res );
        return next();
    }
    else{
        request.post( {
            url: pdfConfig.host + '/pdfs',
            json: {
                template_name: 'reporting',
                data: {
                    data: req.params.chart
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
                    var fileName = 'report.pdf';

                    res.setHeader( 'Content-Transfer-Encoding', 'base64' );
                    res.setHeader( 'Content-Description', 'File Transfer' );
                    res.setHeader( 'Content-Disposition', 'attachment; filename="' + fileName + '"' );
                    res.setHeader( 'Content-Type', 'application/pdf' );

                    var buffer = new Buffer( pdfBody.data, 'base64' );
                    res.send( 200, buffer );
                    return next();
                }
            }
        } );
    }
}
