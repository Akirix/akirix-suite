




var Sequelize = require( 'sequelize' );
var db = require( '../models' );
var _ = require( 'lodash' );
var json2csv = require( 'json2csv' );
var Stream = require( 'stream' );
var Hashids = require( "hashids" );
var math = require( 'mathjs' );

var Account = db.Account;
var Fund = db.Fund;
var Company = db.Company;
var Currency = db.Currency;
var Transaction = db.Transaction;

var util = require( '../lib/akx.util.js' );
var logger = require( '../lib/akx.logger.js');
var _this = this;
var hashidConfig = require( '../config/config.json' ).secrets.hashId;
var hashids = new Hashids( hashidConfig, 11, "LP4D7XBFO8A2NZYK5EUIR6MVH3WQJGS10TC9" );

exports.handleError = function( err, req, res ){
    util.handleError( 'account', err, req, res );
};





exports.index = function( req, res, next ){
    var whereCond = [
        { company_id: req.user.company_id }
    ];

    if( req.params.hasOwnProperty( 'currency_id' ) ){
        req.assert( 'currency_id', 'isString' );
        whereCond.push( { currency_id: req.params.currency_id } );
    }

    if( req.params.hasOwnProperty( 'type' ) ){
        if( req.assert( 'type', 'isString' ) === true ){
            req.params.type = parseInt( req.params.type );
            req.assert( 'type', 'isIn', Account.rawAttributes.type.validate.isIn[ 0 ] );
        }
        whereCond.push( { type: req.params.type } );
    }

    if( req.params.hasOwnProperty( 'fund_id' ) ){
        req.assert( 'fund_id', 'isString' );
        whereCond.push( { fund_id: req.params.fund_id } );
        whereCond.splice( 0, 1 );
    }

    if( _.isEmpty( req.validationErrors ) ){
        Account.findAll( {
            where: whereCond,
            include: [
                { model: Fund }
            ]
        } )
            .done( function( err, accounts ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{
                    var chainer = new Sequelize.Utils.QueryChainer;

                    for( var i = 0; i < accounts.length; i++ ){
                        if( accounts[ i ].company_id === req.user.company_id || ( !_.isEmpty( accounts[ i ].fund ) && accounts[ i ].fund.investor_id === req.user.company_id ) ){
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
                        else{
                            accounts.splice( i, 1 );
                            i--;
                        }
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

    req.assert( 'account_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        Account.find( {
            where: [
                { id: req.params.account_id }
            ],
            include: [
                { model: Fund }
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
                else if( account.company_id !== req.user.company_id || ( !_.isEmpty( account.fund ) && account.fund.investor_id !== req.user.company_id ) ){
                    res.send( 403, { errors: [ 'Cannot access account' ] } );
                    logger.error( 'security', 'company_id in request does not match the token company_id', {
                        req: req
                    } );
                    return next();
                }
                else{
                    var chainer = new Sequelize.Utils.QueryChainer;

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





exports.update = function( req, res, next ){

    req.assert( 'account', 'isObject' );
    req.assert( 'account_id', 'isString' );
    req.assert( 'account.name', 'isString' );


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
                else if( !account ){
                    res.send( 404 );
                    logger.error( 'account', 'account not found using id [' + req.params.account_id + ']', {
                        req: req
                    } );
                    return next();
                }
                else{
                    account.name = req.body.account.name;
                    account.save()
                        .then( function(){
                            logger.log( 'account', 'Account: ' + account.id + ' name was updated from: ' + account.selectedValues.name, {
                                req: req,
                                model: 'account',
                                model_id: account.id
                            } );
                            res.send( 200, { account: account } );
                            return next();
                        } )
                }

            } );
    }
    else {
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
                                                var stream = new Stream();
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
                                }
                            }
                        )
                    }
                    else{
                        res.send( 400, { errors: [ 'Need to specify date range.' ] } );
                        return next();
                    }
                }
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

        req.body.data.amount = Number( req.body.data.amount );
        Account.find( {
            where: [
                { id: req.params.account_id },
                { company_id: req.user.company_id },
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
                    logger.error( 'account', 'account not found using id [' + req.params.account_id + ']', {
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
                    logger.error( 'account', 'Amount is <= 0', {
                        req: req
                    } );
                    return next();
                }
                else{
                    if( account.balance < req.body.data.amount ){
                        res.send( 400, { errors: [ 'Insufficient fund' ] } );
                        logger.error( 'account', 'Account [' + account.id + '] has insufficient funds', {
                            req: req
                        } );
                        return next();
                    }
                    else{
                        Account.find( {
                            where: [
                                { id: req.body.data.to_account_id },
                                { company_id: req.user.company_id },
                                { currency_id: account.currency_id }
                            ]
                        } ).done( function( err, toAccount ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else if( _.isEmpty( toAccount ) ){
                                res.send( 400, { errors: [ 'Cannot find account within this company' ] } );
                                logger.error( 'account', 'account not found using id [' + req.body.data.to_account_id + ']', {
                                    req: req
                                } );
                                return next();
                            }
                            else{

                                account.balance = math.round( account.balance - req.body.data.amount, 2 );
                                account.save().done( function( err ){
                                    if( !!err ){
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else{
                                        var newTransaction = Transaction.build( {
                                            currency_id: account.currency_id,
                                            from_account_id: account.id,
                                            to_account_id: toAccount.id,
                                            amount: req.body.data.amount,
                                            type: 5,
                                            status: 0
                                        } );
                                        newTransaction.save().done( function( err ){
                                            if( !!err ){
                                                _this.handleError( err, req, res );
                                                return next();
                                            }
                                            else{
                                                logger.log( 'account', 'Account: ' + account.id + ' transfered to: ' + toAccount.id + ' in the amount of: ' + req.body.data.amount, {
                                                    req: req,
                                                    model: 'account',
                                                    model_id: account.id
                                                } );
                                                res.send( 200, { status: 'Ok' } );
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
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};
