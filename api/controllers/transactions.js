





var Sequelize = require( 'sequelize' );
var _ = require( 'lodash' );
var db = require( '../models' );
var Project = db.Project;
var Node = db.Node;
var Fund = db.Fund;
var Company = db.Company;
var Account = db.Account;
var Transaction = db.Transaction;
var DailyBalance = db.DailyBalance;
var moment = require( 'moment-timezone' );

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'transactions', err, req, res );
};





exports.index = function( req, res, next ){
    if( _.isString( req.params.account_id ) || _.isString( req.params.from_account_id ) || _.isString( req.params.to_account_id ) ){
        if( _.isString( req.params.q ) ){
            return _this.search( req, res, next );
        }
        else{
            return _this.findByAccount( req, res, next );
        }
    }
    else if( _.isString( req.params.model ) && _.isString( req.params.model_id ) ){
        return _this.findByModel( req, res, next );
    }
    else{
        res.send( 200, { transactions: [] } );
        return next();
    }
};



exports.search = function( req, res, next ){

    var accountOptions = {
        where: [
            { company_id: req.user.company_id }
        ]
    };

    if( _.isString( req.params.account_id ) ){
        accountOptions.where.push( { id: req.params.account_id } );
    }
    else if( _.isString( req.params.from_account_id ) ){
        accountOptions.where.push( { id: req.params.from_account_id } );
    }
    else if( _.isString( req.params.to_account_id ) ){
        accountOptions.where.push( { id: req.params.to_account_id } );
    }

    Account.findAll( accountOptions )
        .done( function( err, accounts ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( _.isEmpty( accounts ) ){
                res.send( 400, { errors: [ 'Cannot find account' ] } );
                return next();
            }
            else{

                var selectQuery = 'SELECT ';
                var showParams = [
                    '`transactions`.`id`',
                    '`transactions`.`currency_id`',
                    '`transactions`.`from_account_id`',
                    '`transactions`.`to_account_id`',
                    '`transactions`.`model`',
                    '`transactions`.`model_id`',
                    '`transactions`.`parent_id`',
                    '`transactions`.`amount`',
                    '`transactions`.`type`',
                    '`transactions`.`status`'
                ];

                var paramsTestLength = showParams.length - 1;
                _.forEach( showParams, function( param, key ){
                    selectQuery += param;

                    if( key < paramsTestLength ){
                        selectQuery += ', ';
                    }
                } );
                selectQuery += '\n';

                var fromStatement = 'FROM `transactions` ' +
                    'LEFT JOIN `accounts` faccounts ON `transactions`.`from_account_id` = faccounts.id \n' +
                    'LEFT JOIN `accounts` taccounts ON `transactions`.`to_account_id` = taccounts.id \n' +
                    'LEFT JOIN `companies` fcompanies ON faccounts.company_id = fcompanies.id \n' +
                    'LEFT JOIN `companies` tcompanies ON taccounts.company_id = tcompanies.id \n' +
                    'LEFT JOIN `wires` ON transactions.model_id = wires.id \n' +
                    'LEFT JOIN `invoices` ON transactions.model_id = invoices.id \n';

                var whereStatement = 'WHERE `transactions`.`status` = 1 AND `transactions`.`type` <> 7 AND';
                _.forEach( accounts, function( account, key ){
                    whereStatement += '( `transactions`.`from_account_id` = "' + account.id + '" OR `transactions`.`to_account_id` = "' + account.id + '" ) AND \n';
                } );

                whereStatement = whereStatement.substring( 0, whereStatement.length - 5 );

                var searchParams = {
                    'transactions': [
                        'amount'
                    ],
                    'fcompanies': [
                        'account_number',
                        'name'
                    ],
                    'tcompanies': [
                        'account_number',
                        'name'
                    ],
                    'faccounts': [
                        'name',
                        'balance'
                    ],
                    'taccounts': [
                        'name',
                        'balance'
                    ],
                    'wires': [
                        'name',
                        'amount',
                        'bank_name',
                        'code_swift',
                        'code_aba',
                        'code_irc',
                        'account_holder',
                        'account_number',
                        'account_iban'
                    ],
                    'invoices': [
                        'name',
                        'order',
                        'to_company_name',
                        'notes',
                        'amount'
                    ]
                };

                var search = '\'%' + req.params.q + '%\'';
                whereStatement += 'AND ( ';

                _.forEach( searchParams, function( params, table ){
                    _.forEach( params, function( param ){
                        whereStatement += '`' + table + '`.`' + param + '` LIKE ' + search + ' OR \n';
                    } );
                } );

                whereStatement = whereStatement.substring( 0, whereStatement.length - 4 );
                whereStatement += ' )';

                var orderStatement = 'ORDER BY `transactions`.`order` DESC';

                selectQuery = selectQuery + fromStatement + whereStatement + orderStatement;
                var countQuery = 'SELECT COUNT(*) ' + fromStatement + whereStatement;

                req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
                req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );

                var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;

                if( paged ){
                    selectQuery += ' LIMIT ' + req.params.per_page;
                    selectQuery += ' OFFSET ' + ( req.params.page - 1 ) * req.params.per_page;
                }

                db.sequelize.query( countQuery, null, { raw: true } )
                    .done( function( err, countResult ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else{
                            db.sequelize.query( selectQuery, null, { raw: true } )
                                .done( function( err, results ){
                                    if( !!err ){
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else{

                                        var totalPages = 1;
                                        if( paged ){
                                            var count = countResult[ 0 ][ 'COUNT (*)' ];
                                            var rem = count % req.params.per_page;
                                            totalPages = Math.floor( count / req.params.per_page );

                                            if( rem > 0 ){
                                                totalPages++;
                                            }
                                        }

                                        res.send( 200, {
                                            transactions: results,
                                            meta: { total_pages: totalPages }
                                        } );
                                        return next();
                                    }
                                } );
                        }
                    } );
            }
        } );
};



exports.findByModel = function( req, res, next ){
    Transaction.findAll( {
        where: {
            model: req.params.model,
            model_id: req.params.model_id,
            status: [ 0, 1 ]
        },
        include: [
            {
                model: Account,
                as: 'fromAccount'
            },
            {
                model: Account,
                as: 'toAccount'
            }
        ],
        order: [
            [ 'created_at', 'DESC' ]
        ]
    } ).done( function( err, transactions ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else{
            for( var i = 0; i < transactions.length; i++ ){
                if( transactions[ i ].fromAccount.company_id === req.user.company_id || transactions[ i ].toAccount.company_id === req.user.company_id ){
                    transactions[ i ].values.account_id = req.params.account_id;
                }
                else{
                    transactions.splice( i, 1 );
                    i--;
                }
            }

            res.send( 200, { transactions: transactions } );
            return next();
        }

    } );
};


exports.findByAccount = function( req, res, next ){
    var accountOptions = {
        where: [],
        include: [
            { model: Fund }
        ]
    };

    var transactionsOptions = {
        where: [
            { status: 1 }
        ],
        order: [
            [ 'updated_at', 'DESC' ],
            [ 'order', 'DESC' ]
        ]
    };

    // Find if the supplied account_id, from_account_id or to_account_id is owned by the requesting company
    req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
    req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );

    var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
    if( paged ){
        transactionsOptions.offset = ( req.params.page - 1 ) * req.params.per_page;
        transactionsOptions.limit = req.params.per_page;
    }

    if( !_.isEmpty( req.params.account_id ) ){
        accountOptions.where.push( { id: req.params.account_id } );
        transactionsOptions.where.push(
            Sequelize.or(
                { from_account_id: req.params.account_id },
                { to_account_id: req.params.account_id } )
        );
    }
    else{
        var accountOrConditions = [];
        if( !_.isEmpty( req.params.from_account_id ) ){
            accountOrConditions.push( { id: req.params.from_account_id } );
            transactionsOptions.where.push( { from_account_id: req.params.from_account_id } );

        }

        if( !_.isEmpty( req.params.to_account_id ) ){
            accountOrConditions.push( { id: req.params.to_account_id } );
            transactionsOptions.where.push( { to_account_id: req.params.to_account_id } );
        }

        accountOptions.where.push( Sequelize.or.apply( this, accountOrConditions ) );
    }

    Account.find( accountOptions ).done( function( err, account ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else if( _.isEmpty( account ) ){
            res.send( 400, { errors: [ 'Invalid account_id' ] } );
            return next();
        }
        else if( account.company_id !== req.user.company_id && ( !_.isEmpty( account.fund ) && account.fund.investor_id !== req.user.company_id ) ){
            res.send( 403, { errors: [ 'Cannot access account' ] } );
            return next();
        }
        else{

            var validParams = [
                'model',
                'model_id',
                'parent_id',
                'type'
            ];

            _.forEach( validParams, function( value ){
                if( req.params.hasOwnProperty( value ) ){
                    var condition = {};
                    condition[ value ] = req.params[ value ];
                    transactionsOptions.where.push( condition );
                }
            } );

            Transaction.findAndCountAll( transactionsOptions ).done( function( err, transactions ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{
                    var totalPages = 1;
                    if( paged ){
                        var count = transactions.count;
                        var rem = count % req.params.per_page;
                        totalPages = Math.floor( count / req.params.per_page );

                        if( rem > 0 ){
                            totalPages++;
                        }
                    }

                    for( var i = 0; i < transactions.rows.length; i++ ){
                        transactions.rows[ i ].values.account_id = req.params.account_id;
                    }


                    if( !_.isEmpty( req.params.dailyBalance ) && !_.isEmpty( transactions.rows ) ){
                        var beginDay = transactions.rows[ transactions.rows.length - 1 ].updated_at;
                        var endDay = Math.max( transactions.rows[ 0 ].updated_at, new Date() );

                        var totalTransactions = transactions.rows;
                        return DailyBalance.findAll( {
                            where: {
                                account_id: req.params.account_id,
                                created_at: {
                                    between: [ beginDay, moment( endDay ).utc().format( 'YYYY-MM-DD hh:mm:ss' ) ]
                                }
                            },
                            order: [ [ 'created_at', 'DESC' ] ]
                        } ).then( function( dailyBalances ){
                            if( !_.isEmpty( dailyBalances ) ){
                                var dailybalancesArray = [];
                                _.forEach( dailyBalances, function( dailyBalance ){
                                    dailyBalance.dataValues.type = 7;
                                    dailyBalance.dataValues.status = 1;
                                    dailyBalance.dataValues.amount = dailyBalance.dataValues.balance;
                                    dailyBalance.dataValues.updated_at = dailyBalance.dataValues.created_at;
                                    dailybalancesArray.push( dailyBalance );
                                } );

                                totalTransactions = _.union( transactions.rows, dailybalancesArray );
                                totalTransactions = _.sortBy( totalTransactions, 'updated_at'  ).reverse();

                                res.send( 200, { transactions: totalTransactions, meta: { total_pages: totalPages } } );
                                return next();
                            }
                            res.send( 200, { transactions: transactions.rows, meta: { total_pages: totalPages } } );
                            return next();

                        } );

                    } else{
                        res.send( 200, { transactions: transactions.rows, meta: { total_pages: totalPages } } );
                        return next();
                    }

                }
            } );
        }
    } );
};
