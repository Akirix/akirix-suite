

var Sequelize = require( 'sequelize' );
var db = require( '../models' );
var moment = require( 'moment-timezone' );
var math = require( 'mathjs' );
var _ = require( 'lodash' );
var Account = db.Account;
var Node = db.Node;
var Project = db.Project;
var Invoice = db.Invoice;
var InvoiceItem = db.InvoiceItem;
var Transaction = db.Transaction;
var Currency = db.Currency;


var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;



exports.handleError = function( err, req, res ){
    util.handleError( 'transaction', err, req, res );
};





exports.action = function( req, res, next ){
    switch( req.params.type ){
        case 'dashboard-volume':
            exports.dashboardVolume( req, res, next );
            break;
        case 'dashboard-summary':
            exports.dashboardSummary( req, res, next );
            break;
        case 'dashboard-pnl':
            exports.dashboardPNL( req, res, next );
            break;
        case 'pending-items':
            exports.pendingItems( req, res, next );
            break;
        case 'notifications':
            exports.notifications( req, res, next );
            break;
        case'kpi-volume':
            exports.kpiVolume( req, res, next );
            break;
        case 'kpi-summary':
            exports.kpiSummary( req, res, next );
            break;
        case 'kpi-income-companies':
            exports.kpiIncomeCompanies( req, res, next );
            break;
        case 'kpi-expense-companies':
            exports.kpiExpenseCompanies( req, res, next );
            break;
        case 'kpi-wirein-companies':
            exports.kpiWireInCompanies( req, res, next );
            break;
        case 'kpi-wireout-companies':
            exports.kpiWireOutCompanies( req, res, next );
            break;
        case 'kpi-internal-transfers-companies':
            exports.kpiInternalTransfersCompanies( req, res, next );
            break;
        case 'transactions-invoice':
            exports.transactionsInvoice( req, res, next );
            break;
        default:
            res.send( 501 );
            return next();
    }
};




exports.dashboardVolume = function( req, res, next ){

    Account.findAll( {
        where: {
            company_id: req.user.company_id
        },
        attributes: [ 'id', 'currency_id', 'name' ]
    } ).done( function( err, accounts ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else{
            var chainer = new Sequelize.Utils.QueryChainer;
            _.forEach( accounts, function( account ){
                // Income
                chainer.add( db.sequelize.query( "SELECT DAY(updated_at)-1 as day, SUM(amount) as amount FROM transactions WHERE to_account_id = '" + account.id + "' AND status = 1 AND type = 1 AND MONTH(updated_at)=MONTH(NOW()) AND YEAR(updated_at)=YEAR(NOW()) GROUP BY DAY( updated_at )-1" ) );
                // Expense
                chainer.add( db.sequelize.query( "SELECT DAY(updated_at)-1 as day, SUM(amount)*-1 as amount FROM transactions WHERE from_account_id = '" + account.id + "' AND status = 1 AND type = 1 AND MONTH(updated_at)=MONTH(NOW()) AND YEAR(updated_at)=YEAR(NOW()) GROUP BY DAY( updated_at )-1" ) );
            } );

            chainer.run().done( function( err, results ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{

                    var accountCount = 0;
                    var data = [];
                    _.forEach( accounts, function( account ){
                        data.push( {
                            name: account.name + ' Income',
                            data: []
                        } );
                        data.push( {
                            name: account.name + ' Expense',
                            data: []
                        } );

                        for( var i = 0; i < 2; i++ ){
                            results[ accountCount + i ].forEach( function( item ){
                                data[ accountCount + i ].data[ item.day ] = item.amount;
                            } );
                        }

                        accountCount += 2;
                    } );

                    res.send( 200, { data: data } );
                    return next();
                }
            } );
        }
    } );
};

exports.transactionsInvoice = function( req, res, next ){
    Account.findAll( {
        where: {
            company_id: req.user.company_id,
            currency_id: req.params.currency_id
        },
        attributes: [ 'id', 'currency_id', 'name' ]
    } ).then( function( accounts ){
        var chainer = new db.Sequelize.Utils.QueryChainer;

        accounts.forEach( function( account ){
            chainer.add( db.sequelize.query( "SELECT DATE(transactions.updated_at) as day, SUM(amount) as amount FROM transactions WHERE to_account_id = '" + account.id + "'AND transactions.status = 1 AND transactions.type = 1 AND MONTH(updated_at)=MONTH(NOW()) AND YEAR(updated_at)=YEAR(NOW()) GROUP BY DATE(transactions.updated_at)" ) );
        } );

        return chainer.run().then( function( results ){
            var accountCount = 0;
            var data = [];
            results.forEach( function( result ){
                data.push( {
                    name: accounts[ accountCount ].name,
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
        }  );
    } ).catch( function( err ){
        _this.handleError( err, req, res );
        return next();
    } );
};




exports.dashboardSummary = function( req, res, next ){
    db.sequelize.query( "SELECT DISTINCT currencies.id, currencies.symbol FROM accounts INNER JOIN currencies ON accounts.currency_id=currencies.id WHERE accounts.company_id = '" + req.user.company_id + "' ORDER BY FIELD(currencies.id, 'USD','EUR','GBP')" )
        .done( function( err, currencies ){
            var chainer = new Sequelize.Utils.QueryChainer;
            _.forEach( currencies, function( currency ){
                chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(AVG(amount) IS NULL,0,AVG(amount)) as avg FROM invoices WHERE company_id = '" + req.user.company_id + "' AND status IN (1,2,3) AND MONTH(invoice_date)=MONTH(NOW()) AND YEAR(updated_at)=YEAR(NOW()) AND currency_id='" + currency.id + "'" ) );
                chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(AVG(amount) IS NULL,0,AVG(amount)) as avg FROM invoices WHERE to_company_id = '" + req.user.company_id + "' AND status IN (1,2,3) AND MONTH(invoice_date)=MONTH(NOW()) AND YEAR(updated_at)=YEAR(NOW()) AND currency_id='" + currency.id + "'" ) );
                chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(AVG(amount) IS NULL,0,AVG(amount)) as avg FROM wires WHERE company_id = '" + req.user.company_id + "' AND status=2 AND type=1 AND MONTH(updated_at)=MONTH(NOW()) AND YEAR(updated_at)=YEAR(NOW()) AND currency_id='" + currency.id + "'" ) );
                chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(AVG(amount) IS NULL,0,AVG(amount)) as avg FROM wires WHERE company_id = '" + req.user.company_id + "' AND status=2 AND type=0 AND MONTH(updated_at)=MONTH(NOW()) AND YEAR(updated_at)=YEAR(NOW()) AND currency_id='" + currency.id + "'" ) );
            } );
            chainer.run().done( function( err, results ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{
                    var data = {};
                    var idx = 0;
                    _.forEach( currencies, function( currency ){
                        data[ currency.id ] = {
                            currency: currency.id,
                            symbol: currency.symbol,
                            invoices_count: results[ idx ][ 0 ].count,
                            invoices_amount: results[ idx ][ 0 ].amount,
                            invoices_avg: results[ idx ][ 0 ].avg,
                            bills_count: results[ idx + 1 ][ 0 ].count,
                            bills_amount: results[ idx + 1 ][ 0 ].amount,
                            bills_avg: results[ idx + 1 ][ 0 ].avg,
                            transfers_in_count: results[ idx + 2 ][ 0 ].count,
                            transfers_in_amount: results[ idx + 2 ][ 0 ].amount,
                            transfers_in_avg: results[ idx + 2 ][ 0 ].avg,
                            transfers_out_count: results[ idx + 3 ][ 0 ].count,
                            transfers_out_amount: results[ idx + 3 ][ 0 ].amount,
                            transfers_out_avg: results[ idx + 3 ][ 0 ].avg
                        };
                        idx += 4;
                    } );

                    res.send( 200, { data: data } );
                    return next();
                }
            } );
        } );
};



exports.dashboardPNL = function( req, res, next ){
    db.sequelize.query( "SELECT DISTINCT currencies.id, currencies.symbol FROM accounts INNER JOIN currencies ON accounts.currency_id=currencies.id WHERE accounts.company_id = '" + req.user.company_id + "' ORDER BY FIELD(currencies.id, 'USD','EUR','GBP')" )
        .done( function( err, currencies ){
            var chainer = new Sequelize.Utils.QueryChainer;
            _.forEach( currencies, function( currency ){
                chainer.add( db.sequelize.query( "SELECT IF(SUM(amount) IS NULL,0,SUM(amount)) as amount FROM transactions  WHERE to_account_id IN ( SELECT id FROM accounts WHERE company_id = '" + req.user.company_id + "') AND type=1 AND status=1 AND MONTH(updated_at)=MONTH(NOW()) AND YEAR(updated_at)=YEAR(NOW()) AND currency_id='" + currency.id + "'" ) );
                chainer.add( db.sequelize.query( "SELECT IF(SUM(amount) IS NULL,0,SUM(amount)) as amount FROM transactions  WHERE from_account_id IN ( SELECT id FROM accounts WHERE company_id = '" + req.user.company_id + "') AND type=1 AND status=1 AND MONTH(updated_at)=MONTH(NOW()) AND YEAR(updated_at)=YEAR(NOW()) AND currency_id='" + currency.id + "'" ) );
            } );
            chainer.run().done( function( err, results ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{
                    var data = {};
                    var idx = 0;
                    _.forEach( currencies, function( currency ){
                        data[ currency.id ] = {
                            currency: currency.id,
                            symbol: currency.symbol,
                            income: results[ idx ][ 0 ].amount,
                            expense: results[ idx + 1 ][ 0 ].amount,
                            net: results[ idx ][ 0 ].amount - results[ idx + 1 ][ 0 ].amount
                        };
                        idx += 2;
                    } );

                    res.send( 200, { data: data } );
                    return next();
                }
            } );
        } );
};




exports.pendingItems = function( req, res, next ){
    var chainer = new Sequelize.Utils.QueryChainer;
    chainer.add( db.sequelize.query( "SELECT COUNT(*) as count FROM invoices WHERE company_id = '" + req.user.company_id + "' AND status IN (1,2)" ) );
    chainer.add( db.sequelize.query( "SELECT COUNT(*) as count FROM invoices WHERE to_company_id = '" + req.user.company_id + "' AND status IN (1,2)" ) );
    chainer.add( db.sequelize.query( "SELECT COUNT(*) as count FROM nodes WHERE company_id = '" + req.user.company_id + "' AND status=0" ) );
    chainer.run().done( function( err, results ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else{
            var data = [];
            var invoiceCount = results[ 0 ];
            var billCount = results[ 1 ];
            var invitationCount = results[ 2 ];

            data.push( {
                name: 'invoices',
                value: invoiceCount[ 0 ].count
            } );

            data.push( {
                name: 'bills',
                value: billCount[ 0 ].count
            } );

            data.push( {
                name: 'invitations',
                value: invitationCount[ 0 ].count
            } );

            res.send( 200, { data: data } );
            return next();
        }
    } );
};




exports.notifications = function( req, res, next ){
    var chainer = new Sequelize.Utils.QueryChainer;
    chainer.add( db.sequelize.query( "SELECT COUNT(*) as count FROM authenticators WHERE user_id = '" + req.user.id + "' AND status=0 AND type=3" ) );
    chainer.add( db.sequelize.query( "SELECT COUNT(*) as count FROM announcements WHERE publish_from<='" + moment.utc().format() + "' AND publish_to>='" + moment.utc().format() + "'" ) );
    chainer.run().done( function( err, results ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else{
            var data = [];
            var keyCount = results[ 0 ];
            var announCount = results[ 1 ];

            if( keyCount[ 0 ].count > 0 ){
                data.push( {
                    name: 'akirix key',
                    value: keyCount[ 0 ].count
                } );
            }

            if( announCount[ 0 ].count > 0 ){
                data.push( {
                    name: 'announcements',
                    value: announCount[ 0 ].count
                } );
            }

            if( _.isEmpty( data ) ){
                data = null;
            }

            res.send( 200, { data: data } );
            return next();
        }
    } );
};



exports.kpiVolume = function( req, res, next ){

    var startDate = req.params.from_date;
    var endDate = req.params.to_date;
    var account_id = req.params.account_id;
    var chainer = new Sequelize.Utils.QueryChainer;

    // Income
    chainer.add( db.sequelize.query( "SELECT DATE(updated_at) as day, SUM(amount) as amount FROM transactions WHERE to_account_id = '" + account_id + "' AND status = 1 AND type = 1 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') GROUP BY DATE(updated_at)" ) );
    // Expense
    chainer.add( db.sequelize.query( "SELECT DATE(updated_at) as day, SUM(amount)*-1 as amount FROM transactions WHERE from_account_id = '" + account_id + "' AND status = 1 AND type = 1 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') GROUP BY DATE(updated_at)" ) );


    chainer.run().done( function( err, results ){

        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else{
            var idx = 0;
            var data = [];
            var net = {};
            data.push( {
                name: 'Income',
                data: []
            } );
            data.push( {
                name: 'Expense',
                data: []
            } );

            _.forEach( results, function( result ){
                result.forEach( function( item ){
                    data[ idx ].data.push( [ item.day, item.amount ] );

                    if( net.hasOwnProperty( item.day ) ){
                        net[ item.day ] += item.amount;
                    }
                    else{
                        net[ item.day ] = item.amount;
                    }
                } );
                idx += 1;
            } );

            var netData = [];
            for( var key in net ){
                if( net.hasOwnProperty( key ) ){
                    netData.push( [ key, net[ key ] ] )
                }
            }
            netData.sort( function( a, b ){
                var x = new Date( a[ 0 ] ).getTime();
                var y = new Date( b[ 0 ] ).getTime();
                return x < y ? -1 : x > y ? 1 : 0;
            } );

            data.push( {
                name: "Net",
                data: netData
            } );
        }
        res.send( 200, { data: data } );
        return next();
    } );
};






exports.kpiSummary = function( req, res, next ){
    db.sequelize.query( "SELECT DISTINCT currencies.id, currencies.symbol FROM accounts INNER JOIN currencies ON accounts.currency_id=currencies.id WHERE accounts.company_id = '" + req.user.company_id + "' ORDER BY FIELD(currencies.id, 'USD','EUR','GBP')" )
        .done( function( err, currencies ){
            var startDate = req.params.from_date;
            var endDate = req.params.to_date;
            var chainer = new Sequelize.Utils.QueryChainer;
            _.forEach( currencies, function( currency ){
                //income
                chainer.add( db.sequelize.query( "SELECT IF(SUM(amount) IS NULL,0,SUM(amount)) as amount FROM transactions  WHERE to_account_id IN ( SELECT id FROM accounts WHERE company_id = '" + req.user.company_id + "') AND type=1 AND status=1 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "')  AND currency_id='" + currency.id + "'" ) );
                //expense
                chainer.add( db.sequelize.query( "SELECT IF(SUM(amount) IS NULL,0,SUM(amount)) as amount FROM transactions  WHERE from_account_id IN ( SELECT id FROM accounts WHERE company_id = '" + req.user.company_id + "') AND type=1 AND status=1 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "')  AND currency_id='" + currency.id + "'" ) );
                //invoices
                chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(AVG(amount) IS NULL,0,AVG(amount)) as avg FROM invoices WHERE company_id = '" + req.user.company_id + "' AND status IN (1,2,3) AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id='" + currency.id + "'" ) );
                //bills
                chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(AVG(amount) IS NULL,0,AVG(amount)) as avg FROM invoices WHERE to_company_id = '" + req.user.company_id + "' AND status IN (1,2,3) AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id='" + currency.id + "'" ) );
                //transfers in
                chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(AVG(amount) IS NULL,0,AVG(amount)) as avg FROM wires WHERE company_id = '" + req.user.company_id + "' AND status=2 AND type=1 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id='" + currency.id + "'" ) );
                //transfers out
                chainer.add( db.sequelize.query( "SELECT COUNT(*) as count, IF(SUM(amount) IS NULL,0,SUM(amount)) as amount, IF(AVG(amount) IS NULL,0,AVG(amount)) as avg FROM wires WHERE company_id = '" + req.user.company_id + "' AND status=2 AND type=0 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') AND currency_id='" + currency.id + "'" ) );
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
                        data.push( {
                            currency: currency.id,
                            symbol: currency.symbol,
                            income: results[ idx ][ 0 ].amount,
                            expense: results[ idx + 1 ][ 0 ].amount,
                            net: results[ idx ][ 0 ].amount - results[ idx + 1 ][ 0 ].amount,
                            invoices_count: results[ idx + 2 ][ 0 ].count,
                            invoices_amount: results[ idx + 2 ][ 0 ].amount,
                            invoices_avg: results[ idx + 2 ][ 0 ].avg,
                            bills_count: results[ idx + 3 ][ 0 ].count,
                            bills_amount: results[ idx + 3 ][ 0 ].amount,
                            bills_avg: results[ idx + 3 ][ 0 ].avg,
                            transfers_in_count: results[ idx + 4 ][ 0 ].count,
                            transfers_in_amount: results[ idx + 4 ][ 0 ].amount,
                            transfers_in_avg: results[ idx + 4 ][ 0 ].avg,
                            transfers_out_count: results[ idx + 5 ][ 0 ].count,
                            transfers_out_amount: results[ idx + 5 ][ 0 ].amount,
                            transfers_out_avg: results[ idx + 5 ][ 0 ].avg

                        } );
                        idx += 6;
                    } );
                    res.send( 200, { data: data } );
                    return next();
                }
            } );
        } );
};


exports.kpiIncomeCompanies = function( req, res, next ){
    var startDate = req.params.from_date;
    var endDate = req.params.to_date;
    var chainer = new Sequelize.Utils.QueryChainer;
    var account_id = req.params.account_id;
    //income
    chainer.add( db.sequelize.query( "SELECT companies.id, companies.name as name, SUM(amount) as amount FROM transactions JOIN accounts ON transactions.from_account_id = accounts.id JOIN companies ON accounts.company_id = companies.id WHERE transactions.to_account_id = '" + account_id + "'  AND transactions.status = 1 AND transactions.type = 1 AND (transactions.updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') GROUP BY companies.id,companies.name" ) );
    chainer.run().done( function( err, results ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else{
            var idx = 0;
            var data = [];
            data.push( {
                name: 'Income',
                data: []
            } );
            _.forEach( results, function( result ){
                result.forEach( function( item ){
                    data[ idx ].data.push( [ item.name, item.amount ] );
                } );
                idx += 1;
            } );
        }
        res.send( 200, { data: data } );
        return next();
    } );
};

exports.kpiExpenseCompanies = function( req, res, next ){
    var startDate = req.params.from_date;
    var endDate = req.params.to_date;
    var chainer = new Sequelize.Utils.QueryChainer;
    var account_id = req.params.account_id;
    //expense
    chainer.add( db.sequelize.query( "SELECT companies.id, companies.name as name, SUM(amount) as amount FROM transactions JOIN accounts ON transactions.to_account_id = accounts.id JOIN companies ON accounts.company_id = companies.id WHERE transactions.from_account_id = '" + account_id + "'  AND transactions.status = 1 AND transactions.type = 1 AND (transactions.updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') GROUP BY companies.id,companies.name" ) );
    chainer.run().done( function( err, results ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else{
            var idx = 0;
            var data = [];
            data.push( {
                name: 'Expense',
                data: []
            } );
            _.forEach( results, function( result ){
                result.forEach( function( item ){
                    data[ idx ].data.push( [ item.name, item.amount ] );
                } );
                idx += 1;
            } );
        }
        res.send( 200, { data: data } );
        return next();
    } );
};

exports.kpiWireInCompanies = function( req, res, next ){
    var startDate = req.params.from_date;
    var endDate = req.params.to_date;
    var chainer = new Sequelize.Utils.QueryChainer;
    var account_id = req.params.account_id;
    //wire in
    chainer.add( db.sequelize.query( "SELECT account_holder as name, SUM(amount) as amount FROM wires WHERE account_id = '" + account_id + "'  AND status = 2 AND type = 1 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') GROUP BY account_holder" ) );
    chainer.run().done( function( err, results ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else{
            var idx = 0;
            var data = [];
            data.push( {
                name: 'Wire In',
                data: []
            } );
            _.forEach( results, function( result ){
                result.forEach( function( item ){
                    data[ idx ].data.push( [ item.name, item.amount ] );
                } );
                idx += 1;
            } );
        }
        res.send( 200, { data: data } );
        return next();
    } );
};

exports.kpiWireOutCompanies = function( req, res, next ){
    var startDate = req.params.from_date;
    var endDate = req.params.to_date;
    var chainer = new Sequelize.Utils.QueryChainer;
    var account_id = req.params.account_id;
    //wire out
    chainer.add( db.sequelize.query( "SELECT account_holder as name, SUM(amount) as amount FROM wires WHERE account_id = '" + account_id + "'  AND status = 2 AND type = 0 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') GROUP BY account_holder" ) );
    chainer.run().done( function( err, results ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else{
            var idx = 0;
            var data = [];
            data.push( {
                name: 'Wire Out',
                data: []
            } );
            _.forEach( results, function( result ){
                result.forEach( function( item ){
                    data[ idx ].data.push( [ item.name, item.amount ] );
                } );
                idx += 1;
            } );
        }
        res.send( 200, { data: data } );
        return next();
    } );
};

exports.kpiInternalTransfersCompanies = function( req, res, next ){
    var startDate = req.params.from_date;
    var endDate = req.params.to_date;
    var chainer = new Sequelize.Utils.QueryChainer;
    var account_id = req.params.account_id;
    //internal transfer
    chainer.add( db.sequelize.query( "SELECT account_holder as name, SUM(amount) as amount FROM wires WHERE account_id = '" + account_id + "'  AND status = 2 AND type = 2 AND (updated_at BETWEEN '" + startDate + "' AND '" + endDate + "') GROUP BY account_holder" ) );
    chainer.run().done( function( err, results ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else{
            var idx = 0;
            var data = [];
            data.push( {
                name: 'Internal Transfer',
                data: []
            } );
            _.forEach( results, function( result ){
                result.forEach( function( item ){
                    data[ idx ].data.push( [ item.name, item.amount ] );
                } );
                idx += 1;
            } );
        }
        res.send( 200, { data: data } );
        return next();
    } );


};

