





var Sequelize = require( 'sequelize' );
var db = require( '../models' );
var dbUber = require( '../models_uber' );
var math = require( 'mathjs' );
var moment = require( 'moment-timezone' );
var _ = require( 'lodash' );
var json2csv = require( 'json2csv' );
var Stream = require( 'stream' );
var Account = db.Account;
var Company = db.Company;
var Currency = db.Currency;
var Fund = db.Fund;
var Transaction = db.Transaction;
var UberTask = dbUber.UberTask;

var sweepConfig = require( '../config/config.json' ).sweep;

var notifier = require( '../lib/akx.notifier.js' );
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'account', err, req, res );
};







exports.index = function( req, res, next ){

    var query = {
        where: [],
        order: "FIELD(accounts.currency_id, 'USD','EUR','GBP')"
    };

    if( !_.isEmpty( req.params.company_id ) ){
        query.where.push( { company_id: req.params.company_id } );
    }

    if( !_.isEmpty( req.params.currency_id ) ){
        query.where.push( { currency_id: req.params.currency_id } );
    }

    if( _.isEmpty( query.where ) ){
        query.where = {};
    }

    if( _.isEmpty( req.validationErrors ) ){
        Account.findAll( query )
            .done( function( err, accounts ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{
                    var chainer = new db.Sequelize.Utils.QueryChainer;

                    for( var i = 0; i < accounts.length; i++ ){
                        // Points In
                        chainer.add( db.sequelize.query( "SELECT SUM(points)+SUM(points_guarantee)+SUM(points_cash) as amount FROM nodes WHERE account_id='" + accounts[ i ].id + "'" ) );
                        // Points Out
                        chainer.add( db.sequelize.query( "SELECT SUM(n2.points) as amount FROM nodes n1 INNER JOIN nodes n2 ON n1.id = n2.parent_id WHERE n1.account_id='" + accounts[ i ].id + "'" ) );
                        // Points Out My Money
                        chainer.add( db.sequelize.query( "SELECT SUM(n2.points_guarantee)+SUM(n2.points_cash) as amount FROM nodes n1 INNER JOIN nodes n2 ON n1.id = n2.parent_id WHERE n1.account_id='" + accounts[ i ].id + "'" ) );
                        // Pending In
                        chainer.add( db.sequelize.query( "SELECT SUM(amount) as amount FROM transactions WHERE to_account_id='" + accounts[ i ].id + "' AND status=0" ) );
                        // Pending Out
                        chainer.add( db.sequelize.query( "SELECT SUM(amount) as amount FROM transactions WHERE from_account_id='" + accounts[ i ].id + "' AND status=0" ) );
                    }

                    chainer.run()
                        .done( function( err, results ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else{
                                for( var i = 0; i < accounts.length; i++ ){
                                    accounts[ i ].values.points_in = results[ i * 5 ][ 0 ].amount === null ? 0 : results[ i * 5 ][ 0 ].amount;
                                    accounts[ i ].values.points_out = results[ i * 5 + 1 ][ 0 ].amount === null ? 0 : results[ i * 5 + 1 ][ 0 ].amount;
                                    accounts[ i ].values.points_out_cash = results[ i * 5 + 2 ][ 0 ].amount === null ? 0 : results[ i * 5 + 2 ][ 0 ].amount;
                                    accounts[ i ].values.pending_in = results[ i * 5 + 3 ][ 0 ].amount === null ? 0 : results[ i * 5 + 3 ][ 0 ].amount;
                                    accounts[ i ].values.pending_out = results[ i * 5 + 4 ][ 0 ].amount === null ? 0 : results[ i * 5 + 4 ][ 0 ].amount;
                                }
                                res.send( 200, { accounts: accounts } );
                                return next();
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






exports.view = function( req, res, next ){

    if( _.isEmpty( req.validationErrors ) ){

        Account.find( {
            where: {
                id: req.params.account_id
            }

        } )
            .done( function( err, account ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{
                    var chainer = new db.Sequelize.Utils.QueryChainer;

                    // Points In
                    chainer.add( db.sequelize.query( "SELECT SUM(points)+SUM(points_guarantee)+SUM(points_cash) as amount FROM nodes WHERE account_id='" + account.id + "'" ) );
                    // Points Out
                    chainer.add( db.sequelize.query( "SELECT SUM(n2.points) as amount FROM nodes n1 INNER JOIN nodes n2 ON n1.id = n2.parent_id WHERE n1.account_id='" + account.id + "'" ) );
                    // Points Out My Money
                    chainer.add( db.sequelize.query( "SELECT SUM(n2.points_guarantee)+SUM(n2.points_cash) as amount FROM nodes n1 INNER JOIN nodes n2 ON n1.id = n2.parent_id WHERE n1.account_id='" + account.id + "'" ) );
                    // Pending In
                    chainer.add( db.sequelize.query( "SELECT SUM(amount) as amount FROM transactions WHERE to_account_id='" + account.id + "' AND status=0" ) );
                    // Pending Out
                    chainer.add( db.sequelize.query( "SELECT SUM(amount) as amount FROM transactions WHERE from_account_id='" + account.id + "' AND status=0" ) );

                    chainer.run()
                        .done( function( err, results ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else{
                                account.values.points_in = results[ 0 ][ 0 ].amount === null ? 0 : results[ 0 ][ 0 ].amount;
                                account.values.points_out = results[ 1 ][ 0 ].amount === null ? 0 : results[ 1 ][ 0 ].amount;
                                account.values.points_out_cash = results[ 2 ][ 0 ].amount === null ? 0 : results[ 2 ][ 0 ].amount;
                                account.values.pending_in = results[ 3 ][ 0 ].amount === null ? 0 : results[ 3 ][ 0 ].amount;
                                account.values.pending_out = results[ 4 ][ 0 ].amount === null ? 0 : results[ 4 ][ 0 ].amount;
                                res.send( 200, { account: account } );
                                return next();
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






exports.create = function( req, res, next ){


    req.assert( 'account', 'isObject' );
    req.assert( 'account.company_id', 'isString' );
    req.assert( 'account.currency_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        Company.find( {
            where: {
                id: req.params.account.company_id
            }
        } )
            .done( function( err, company ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{
                    Currency.find( {
                        where: {
                            id: req.params.account.currency_id
                        }
                    } )
                        .done( function( err, currency ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else{
                                var newAccount = Account.build( {
                                    company_id: req.params.account.company_id,
                                    currency_id: req.params.account.currency_id,
                                    balance: 0,
                                    balance_hold: 0,
                                    type: 0
                                } );

                                if( _.isEmpty( req.params.account.name ) ){
                                    newAccount.values.name = newAccount.currency_id + ' Account';
                                }
                                else{
                                    newAccount.values.name = req.params.account.name;
                                }

                                newAccount.save()
                                    .done( function( err ){
                                        if( !!err ){
                                            _this.handleError( err, req, res );
                                            return next();
                                        }
                                        else{
                                            logger.info( 'account', 'new account added for company [' + req.params.account.company_id + '] added', {
                                                req: req,
                                                model: 'account',
                                                model_id: newAccount.id
                                            } );
                                            res.send( 201, { account: newAccount } );
                                            return next();
                                        }
                                    } );
                            }
                        } )
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};







exports.update = function( req, res, next ){

    req.assert( 'account_id', 'isString' );
    req.assert( 'account', 'isObject' );


    if( _.isEmpty( req.validationErrors ) ){
        Account.find( {
            where: {
                id: req.params.account_id
            }
        } )
            .done( function( err, account ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{
                    var updateValues = [
                        { value: 'name', validation: _.isString },
                    ];


                    _.forEach( updateValues, function( updateValue ){
                        if( updateValue.validation( req.params.account[ updateValue.value ] ) ){
                            account[ updateValue.value ] = req.params.account[ updateValue.value ];
                        }
                    } );

                    account.save().done( function( err ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else{

                            if( _.has( account.values, 'hash' ) ){
                                delete account.values.hash;
                            }

                            logger.info( 'account', 'account[' + account.name + '] has been updated for company [' + account.company_id + ']', {
                                req: req,
                                model: 'account',
                                model_id: account.id,
                                previousValues: account.selectedValues
                            } );
                            res.send( 200, { account: account } );
                            return next();
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







exports.download = function( req, res, next ){

    req.assert( 'account_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        Account.find( {
            where: [
                { id: req.params.account_id }
            ],
            include: [
                { model: Fund },
                { model: Company }
            ]
        } )
            .done( function( err, account ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else if( _.isEmpty( account ) ){
                        res.send( 400, { errors: [ 'Cannot find account' ] } );
                        logger.error( 'account', 'account not found using id [' + req.params.account_id + ']', {
                            req: req
                        } );
                        return next();
                    }
                    else if( account.company_id !== req.user.company_id && ( !_.isEmpty( account.fund ) && account.fund.investor_id !== req.user.company_id ) ){
                        res.send( 403, { errors: [ 'Cannot access account' ] } );
                        logger.error( 'security', 'company_id in request does not match the token company_id', {
                            req: req
                        } );
                        return next();
                    }
                    else{
                        if( req.params.period_from && req.params.period_to ){
                            var query = "SELECT " +
                                "transactions.updated_at as 'Date'," +
                                "(CASE transactions.type " +
                                "WHEN 1 THEN 'Invoice' " +
                                "WHEN 3 THEN 'Fee' " +
                                "WHEN 4 THEN 'Money Transfer' " +
                                "WHEN 5 THEN 'Account Transfer' " +
                                "WHEN 8 THEN 'Commission' " +
                                "WHEN 9 THEN 'FX' " +
                                "ELSE transactions.model " +
                                "END) as 'Type', " +
                                "IF(fcompanies.id='masterco-mpan-yisa-kiri-xtheidislong', 'Akirix', CONCAT('XYZ',fcompanies.account_number, ' ',fcompanies.name)) as 'From'," +
                                "IF(tcompanies.id='masterco-mpan-yisa-kiri-xtheidislong', 'Akirix', CONCAT('XYZ',tcompanies.account_number, ' ',tcompanies.name)) as 'To'," +
                                "IF(transactions.type <> 3," +
                                "CASE transactions.model " +
                                "WHEN 'wire' THEN CONCAT('W-', wires.name, ' ', wires.account_holder, ' (', wires.bank_name, ', ', wires.bank_country, ')') " +
                                "WHEN 'invoice' THEN CONCAT('I-', invoices.name) " +
                                "WHEN 'fx-request' THEN CONCAT('FX-', fx_requests.name, ' ', fx_requests.base_currency_id, ' ', fx_requests.base_amount, ' -> ', fx_requests.counter_currency_id, ' ', fx_requests.counter_amount ) " +
                                "END," +
                                "'Fee') as 'Description'," +
                                "IF(transactions.from_account_id = '" + req.params.account_id + "', -1 * transactions.amount,'') as 'Debit Amount'," +
                                "IF(transactions.to_account_id = '" + req.params.account_id + "', transactions.amount, '') as 'Credit Amount' " +
                                "FROM " +
                                "transactions LEFT JOIN accounts faccounts ON transactions.from_account_id = faccounts.id LEFT JOIN accounts taccounts ON transactions.to_account_id = taccounts.id LEFT JOIN companies fcompanies ON faccounts.company_id = fcompanies.id LEFT JOIN companies tcompanies ON taccounts.company_id = tcompanies.id LEFT JOIN wires ON transactions.model_id = wires.id LEFT JOIN invoices ON transactions.model_id = invoices.id LEFT JOIN fx_requests ON transactions.model_id = fx_requests.id " +
                                "WHERE " +
                                "(transactions.from_account_id = '" + req.params.account_id + "' OR transactions.to_account_id = '" + req.params.account_id + "') " +
                                "AND transactions.updated_at >= '" + req.params.period_from + " 00:00:00' AND transactions.updated_at <= '" + req.params.period_to + " 23:59:59' " +
                                "AND transactions.status = 1 " +
                                "AND (transactions.model <> 'node' OR transactions.model IS NULL) " +
                                "AND transactions.type <> 7 " +
                                "ORDER BY " +
                                "transactions.updated_at ASC," +
                                "transactions.order ASC";

                            db.sequelize.query( query )
                                .done( function( err, results ){
                                        if( !!err ){
                                            _this.handleError( err, req, res );
                                            return next();
                                        }
                                        else{
                                            if( req.params.file_type === 'qbo' ){
                                                var chainer = new Sequelize.Utils.QueryChainer;
                                                chainer.add( db.sequelize.query( "SELECT SUM(n2.points_guarantee)+SUM(n2.points_cash) as amount FROM nodes n1 INNER JOIN nodes n2 ON n1.id = n2.parent_id WHERE n1.account_id='" + account.id + "'" ) );
                                                chainer.add( db.sequelize.query( "SELECT SUM(amount) as amount FROM transactions WHERE from_account_id='" + account.id + "' AND status=0" ) );
                                                chainer.run()
                                                    .done( function( err, balance ){
                                                        if( !!err ){
                                                            _this.handleError( err, req, res );
                                                            return next();
                                                        }
                                                        else{
                                                            var points_out_cash = balance[ 0 ][ 0 ].amount === null ? 0 : balance[ 0 ][ 0 ].amount;
                                                            var pending_out = balance[ 1 ][ 0 ].amount === null ? 0 : balance[ 1 ][ 0 ].amount;
                                                            var balamt = points_out_cash + pending_out + account.balance + account.balance_hold;
                                                            var stmttrn = '';
                                                            var i = 0;
                                                            var date = null;
                                                            var d = new Date();
                                                            results.forEach( function( result ){
                                                                if( date === result.Date.toISOString().slice( 0, 10 ).replace( /-/g, "" ) ){
                                                                    i++;
                                                                }
                                                                stmttrn += _this.quickBooks( i, result );
                                                                date = result.Date.toISOString().slice( 0, 10 ).replace( /-/g, "" );
                                                            } );

                                                            var qbo =
                                                                "OFXHEADER: 100" + "\n" +
                                                                "DATA: OFXSGML" + "\n" +
                                                                "VERSION: 102" + "\n" +
                                                                "SECURITY: NONE" + "\n" +
                                                                "ENCODING: USASCII" + "\n" +
                                                                "CHARSET: 1252" + "\n" +
                                                                "COMPRESSION: NONE" + "\n" +
                                                                "OLDFILEUID: NONE" + "\n" +
                                                                "NEWFILEUID: NONE " + "\n" +
                                                                "<OFX> " + "\n" +
                                                                "<SIGNONMSGSRSV1> " + "\n" +
                                                                "<SONRS>" + "\n" +
                                                                "<STATUS> " + "\n" +
                                                                "<CODE>0" + "\n" +
                                                                "<SEVERITY>INFO" + "\n" +
                                                                "</STATUS>" + "\n" +
                                                                "<DTSERVER>" + d.toISOString().slice( 0, 10 ).replace( /-/g, "" ) + "\n" +
                                                                "<LANGUAGE>ENG " + "\n" +
                                                                "<FI>" + "\n" +
                                                                "<ORG>AKIRIX" + "\n" +
                                                                "<FID>000" + "\n" +
                                                                "</FI>" + "\n" +
                                                                "<INTU.BID>01234 " + "\n" +
                                                                "</SONRS> " + "\n" +
                                                                "</SIGNONMSGSRSV1>" + "\n" +
                                                                "<BANKMSGSRSV1>" + "\n" +
                                                                "<STMTTRNRS>" + "\n" +
                                                                "<TRNUID>1" + "\n" +
                                                                "<STATUS>" + "\n" +
                                                                "<CODE>0 " + "\n" +
                                                                "<SEVERITY>INFO " + "\n" +
                                                                "<MESSAGE>Success" + "\n" +
                                                                "</STATUS>" + "\n" +
                                                                "<STMTRS>" + "\n" +
                                                                "<CURDEF>" + account.currency_id + "\n" +
                                                                "<BANKACCTFROM>" + "\n" +
                                                                "<BANKID>XYZ" + "\n" +
                                                                "<ACCTID>" + account.id + "\n" +
                                                                "<ACCTTYPE>CHECKING" + "\n" +
                                                                "</BANKACCTFROM>" + "\n" +
                                                                "<BANKTRANLIST>" + "\n" +
                                                                "<DTSTART>" + req.params.period_from.replace( /-/g, "" ) + "\n" +
                                                                "<DTEND>" + req.params.period_to.replace( /-/g, "" ) + "\n";
                                                            qbo = qbo + stmttrn;

                                                            qbo += "</BANKTRANLIST>" + "\n" +
                                                                "<LEDGERBAL>" + "\n" +
                                                                "<BALAMT>" + balamt + "\n" +
                                                                "<DTASOF>" + d.toISOString().slice( 0, 10 ).replace( /-/g, "" ) + "\n" +
                                                                "</LEDGERBAL>" + "\n" +
                                                                "<AVAILBAL>" + "\n" +
                                                                "<BALAMT>" + account.balance + "\n" +
                                                                "<DTASOF>" + d.toISOString().slice( 0, 10 ).replace( /-/g, "" ) + "\n" +
                                                                "</AVAILBAL>" + "\n" +
                                                                "</STMTRS>" + "\n" +
                                                                "</STMTTRNRS>" + "\n" +
                                                                "</BANKMSGSRSV1>" + "\n" +
                                                                "</OFX>";

                                                            res.setHeader( 'Content-disposition', 'attachment; filename=' + 'transactions.qbo' );
                                                            res.setHeader( 'Content-type', 'text/qbo' );
                                                            res.send( 200, qbo );
                                                            return next();
                                                        }
                                                    } );

                                            } else if( req.params.file_type === 'csv' ){
                                                json2csv( {
                                                    data: results,
                                                    fields: [ 'Date', 'Type', 'From', 'To', 'Description', 'Debit Amount', 'Credit Amount' ]
                                                }, function( err, csv ){
                                                    if( !!err ){
                                                        _this.handleError( err, req, res );
                                                        return next();
                                                    }
                                                    else{
                                                        if( req.params.file_type === 'csv' ){
                                                            res.setHeader( 'Content-disposition', 'attachment; filename=' + 'transactions.csv' );
                                                            res.setHeader( 'Content-type', 'text/csv' );
                                                            res.send( 200, csv );
                                                            return next();
                                                        }
                                                        else{
                                                            res.send( 400, { errors: [ 'Unsupported file format' ] } );
                                                            logger.error( 'account', '[' + req.params.file_type + '] is an unsupported file type',
                                                                {
                                                                    req: req
                                                                } );
                                                            return next();
                                                        }
                                                    }
                                                } );
                                            } else{
                                                res.send( 400, { errors: [ 'Unsupported file format' ] } );
                                                logger.error( 'account', '[' + req.params.file_type + '] is an unsupported file type',
                                                    {
                                                        req: req
                                                    } );
                                                return next();
                                            }
                                        }
                                    }
                                )
                        }
                        else{
                            res.send( 400, { errors: [ 'Need to specify date range.' ] } );
                            return next();
                        }
                    }
                }
            );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.quickBooks = function( i, result ){
    var transactionFullDate = result.Date.toISOString().slice( 0, 10 ).replace( /-/g, "" );
    var qbo = "<STMTTRN>" + "\n" +
        "<TRNTYPE>" + result.Type + "\n" +
        "<DTPOSTED>" + transactionFullDate + "\n";
    if( result[ 'Debit Amount' ] ){
        qbo += "<TRNAMT>" + result[ 'Debit Amount' ] + "\n"
    }
    else{
        qbo += "<TRNAMT>" + result[ 'Credit Amount' ] + "\n"
    }
    qbo += "<FITID>" + transactionFullDate + i + "\n" +
        "<NAME>" + result.To + "\n" +
        "<MEMO>" + result.Description + "\n" +
        "</STMTTRN>" + "\n";
    return qbo;
};

exports.hold = function( req, res, next ){

    req.assert( 'account_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        Account.find( {
            where: [
                { id: req.params.account_id }
            ]
        } ).done( function( err, account ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( _.isEmpty( account ) ){
                res.send( 404, { errors: [ 'Cannot find account' ] } );
                return next();
            }
            else if( req.params.data.amount < 0 || req.params.data.amount > account.balance + account.balance_hold ){
                res.send( 400, { errors: [ 'Invalid cash on hold amount' ] } );
                return next();
            }
            else{
                var diff = Number( account.balance_hold ) - Number( req.params.data.amount );
                var newBalance = math.round( account.balance + diff, 2 );
                var newBalanceHold = req.params.data.amount;

                var query = 'UPDATE accounts' +
                    ' SET balance=' + newBalance + ', balance_hold=' + newBalanceHold +
                    ' WHERE balance+balance_hold=' + newBalance + '+' + newBalanceHold + ' AND id="' + account.id + '"';

                db.sequelize.query( query ).spread( function( err, metadata ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else{
                        account.values.balance = newBalance;
                        account.values.balance_hold = newBalanceHold;
                        res.send( 200, { account: account } );
                        logger.info( 'account', 'A hold has been added to company [' + account.company_id + '] in the amount of ' + req.params.data.amount, {
                            req: req,
                            model: 'account',
                            model_id: account.id
                        } );
                        return next();
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

exports.feeRefund = function( req, res, next ){
    req.assert( 'account_id', 'isString' );
    req.assert( 'data', 'isObject' );
    req.assert( 'data.amount', 'isNumber' );
    req.assert( 'data.notes', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        if( req.body.data.amount <= 0 ){
            res.send( 400, { errors: [ 'Invalid amount' ] } );
            return next();
        }

        db.sequelize.transaction( function( t ){
            Account.find( {
                where: {
                    id: req.params.account_id
                },
                include: [
                    { model: Company }
                ]
            } )
                .success( function( compAcc ){
                    if( _.isEmpty( compAcc ) ){
                        res.send( 400, { errors: [ 'Invalid company account' ] } );
                        return next();
                    }
                    else if( compAcc.company.status === 0 ){
                        res.send( 400, { errors: [ 'Closed company' ] } );
                        return next();
                    }
                    else{
                        Currency.find( {
                            where: {
                                id: compAcc.currency_id
                            }
                        } )
                            .success( function( currency ){
                                Account.find( {
                                    where: {
                                        id: currency.refund_account_id
                                    }
                                } )
                                    .success( function( akirixRefundAccount ){
                                        if( akirixRefundAccount.balance >= req.body.data.amount ){
                                            Account.update(
                                                {
                                                    balance: akirixRefundAccount.balance - req.body.data.amount
                                                },
                                                {
                                                    balance: akirixRefundAccount.balance,
                                                    id: akirixRefundAccount.id
                                                }, { transaction: t }
                                            )
                                                .success( function( affectedRows ){
                                                    if( affectedRows === 1 ){
                                                        var newRefundTransaction = {
                                                            currency_id: currency.id,
                                                            from_account_id: akirixRefundAccount.id,
                                                            to_account_id: compAcc.id,
                                                            type: 3,
                                                            status: 0,
                                                            amount: req.body.data.amount
                                                        };
                                                        Transaction.build( newRefundTransaction ).save( { transaction: t } )
                                                            .success( function( successfulRefundTransaction ){
                                                                var newUberTaskRefundNote = {
                                                                    notes: req.body.data.notes,
                                                                    model: 'transaction',
                                                                    model_id: successfulRefundTransaction.id,
                                                                    type: 1,
                                                                    priority: 0,
                                                                    status: 2,
                                                                    company_id: compAcc.company_id,
                                                                    title: 'Fee Refund: ' + currency.symbol + req.body.data.amount,
                                                                    sentiment: 1,
                                                                    due_date: moment().utc(),
                                                                    uber_user_id: req.user.id
                                                                };
                                                                UberTask.build( newUberTaskRefundNote ).save( { transaction: t } )
                                                                    .success( function( successfulUberTaskNote ){
                                                                        t.commit();
                                                                        res.send( 200, { status: 'Ok' } );
                                                                        logger.info( 'account', 'Fee refund has been giving to account [' + compAcc.id + ']', {
                                                                            req: req,
                                                                            model: 'account',
                                                                            model_id: akirixRefundAccount.id
                                                                        } );
                                                                        return next();
                                                                    } )
                                                                    .error( function( err ){
                                                                        t.rollback();
                                                                        _this.handleError( err, req, res );
                                                                        return next();
                                                                    } )
                                                            } )
                                                            .error( function( err ){
                                                                t.rollback();
                                                                _this.handleError( err, req, res );
                                                                return next();
                                                            } );
                                                    }
                                                } )
                                                .error( function( err ){
                                                    t.rollback();
                                                    _this.handleError( err, req, res );
                                                    return next();
                                                } )

                                        }
                                        else{
                                            res.send( 400, { errors: [ 'Insufficient funds in Akirix Refund Account for this currency to issue refund.' ] } );
                                            logger.error( 'account', 'Insufficient funds in Akirix Refund Account [' + akirixRefundAccount.id + '] to issue refund.' );
                                            return next();
                                        }
                                    } )
                                    .error( function( err ){
                                        _this.handleError( err, req, res );
                                        return next();
                                    } )
                            } )
                            .error( function( err ){
                                _this.handleError( err, req, res );
                                return next();
                            } )

                    }

                } )
                .error( function( err ){
                    _this.handleError( err, req, res );
                    return next();
                } );

        } );

    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }

};

exports.transfer = function( req, res, next ){
    req.assert( 'account_id', 'isString' );
    req.assert( 'data', 'isObject' );
    req.assert( 'data.to_account_id', 'isString' );
    req.assert( 'data.amount', 'isNumber' );

    if( _.isEmpty( req.validationErrors ) ){
        db.sequelize.transaction( function( t ){

            req.body.data.amount = Number( req.body.data.amount );
            Account.find( {
                where: [
                    { id: req.params.account_id },
                    { type: 0 }
                ]
            } )
                .done( function( err, account ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else if( !account ){
                        res.send( 400, { errors: [ 'Account not found.' ] } );
                        logger.error( 'account', 'Account with id [' + req.params.account_id + '] was not found', {
                            req: req
                        } );
                        return next();
                    }
                    else if( req.body.data.amount <= 0 ){
                        res.send( 400, {
                            errors: [
                                { 'data.amount': [ 'Amount must be greater than 0' ] }
                            ]
                        } );
                        return next();
                    }
                    else{
                        if( account.balance < req.body.data.amount ){
                            res.send( 400, { errors: [ 'Insufficient fund' ] } );
                            return next();
                        }
                        else{
                            Account.find( {
                                where: [
                                    { id: req.body.data.to_account_id },
                                    { currency_id: account.currency_id }
                                ]
                            } ).done( function( err, toAccount ){
                                if( !!err ){
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else if( _.isEmpty( toAccount ) ){
                                    res.send( 400, { errors: [ 'Cannot find account within this company' ] } );
                                    logger.error( 'account', 'Account with id [' + req.params.account_id + '] was not found', {
                                        req: req
                                    } );
                                    return next();
                                }
                                else{
                                    // Take money from the from account
                                    account.balance = math.round( account.balance - req.body.data.amount, 2 );
                                    account.save( { transaction: t } ).done( function( err ){
                                        if( !!err ){
                                            t.rollback();
                                            _this.handleError( err, req, res );
                                            return next();
                                        }
                                        else{

                                            //create a new transactions between both accounts
                                            var newTransaction = Transaction.build( {
                                                currency_id: account.currency_id,
                                                from_account_id: account.id,
                                                to_account_id: toAccount.id,
                                                amount: req.body.data.amount,
                                                type: 5,
                                                status: 0
                                            } );

                                            newTransaction.save( { transaction: t } ).done( function( err ){
                                                if( !!err ){
                                                    t.rollback();
                                                    _this.handleError( err, req, res );
                                                    return next();
                                                }
                                                else{
                                                    t.commit();
                                                    res.send( 200, { status: 'Ok' } );
                                                    logger.info( 'account', 'Transferred from [' + account.id + '] to account[' + toAccount.id + '] in the amount of ' + req.params.amount, {
                                                        req: req
                                                    } );
                                                    return next();
                                                }
                                            } );
                                        }
                                    } );
                                }
                            } )
                        }
                    }
                } );
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.getSweepConfig = function( req, res, next ){
    if( _.isEmpty( sweepConfig ) ){
        res.send( 200, { sweepConfig: {} } );
        return next();
    }
    else{
        res.send( 200, { sweepConfig: sweepConfig } );
        return next();
    }
};


