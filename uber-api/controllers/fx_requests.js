


var Sequelize = require( 'sequelize' );
var _ = require( 'lodash' );
var math = require( 'mathjs' );
var request = require( 'request' );
var xmlParser = require( 'xml2json' );
var Promise = require( 'promise' );
var Hashids = require( "hashids" );
var hashidConfig = require( '../config/config.json' ).secrets.hashId;

var db = require( '../models' );
var FXRequest = db.FXRequest;
var Company = db.Company;
var User = db.User;
var Account = db.Account;
var Transaction = db.Transaction;
var Currency = db.Currency;
var Fee = db.Fee;

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

var hashids = new Hashids( hashidConfig, 11, "LP4D7XBFH3WQJGS10TC9O8A2NZYK5EUIR6MV" );



exports.handleError = function( err, req, res ){
    util.handleError( 'fx-request', err, req, res );
};


exports.index = function( req, res, next ){

    if( _.isEmpty( req.validationErrors ) ){

        var query = {
            where: [],
            order: 'updated_at DESC'
        };
        req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
        req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );

        var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
        if( paged ){
            query.offset = ( req.params.page - 1 ) * req.params.per_page;
            query.limit = req.params.per_page;
        }

        if( !_.isEmpty( req.params.company_id ) ){
            query.where.push( { company_id: req.params.company_id } );
        }

        if( !_.isEmpty( req.params.status ) ){
            query.where.push( { status: req.params.status } );
        }

        if( !_.isEmpty( req.params.type ) ){
            query.where.push( { type: req.params.type } );
        }

        if( !_.isEmpty( req.params.updated_at ) && req.params.updated_at instanceof Array && req.params.updated_at.length === 2 ){
            var period_from = req.params.updated_at[ 0 ];
            var period_to = req.params.updated_at[ 1 ];
            if( !_.isEmpty( period_from ) && !_.isEmpty( period_to ) ){
                query.where.push( {
                    updated_at: {
                        between: [ period_from + ' 00:00:00', period_to + ' 23:59:59' ]
                    }
                } );
            }
            else if( !_.isEmpty( period_from ) && _.isEmpty( period_to ) ){
                query.where.push( {
                    updated_at: {
                        gte: period_from + ' 00:00:00'
                    }
                } );
            }
            else if( !_.isEmpty( period_to ) && _.isEmpty( period_from ) ){
                query.where.push( {
                    updated_at: {
                        lte: period_to + '23:59:59'
                    }
                } )

            }
        }

        if( !_.isEmpty( req.params.name ) ){
            req.params.name = req.params.name.trim();
            query.where.push( { name: { like: '%' + req.params.name + '%' } } );
        }

        if( !_.isEmpty( req.params.reference ) ){
            req.params.reference = req.params.reference.trim();
            query.where.push( { reference: { like: '%' + req.params.reference + '%' } } );
        }

        if( !_.isEmpty( req.params.base_amount ) ){
            req.params.base_amount = req.params.base_amount.trim();
            query.where.push( { base_amount: { like: '%' + req.params.base_amount + '%' } } );
        }
        if( !_.isEmpty( req.params.counter_amount ) ){
            req.params.counter_amount = req.params.counter_amount.trim();
            query.where.push( { counter_amount: { like: '%' + req.params.counter_amount + '%' } } );
        }


        if( !_.isEmpty( req.params.base_currency_id ) ){
            query.where.push( { base_currency_id: req.params.base_currency_id } );
        }

        if( !_.isEmpty( req.params.counter_currency_id ) ){
            query.where.push( { counter_currency_id: req.params.counter_currency_id } );
        }

        if( _.isEmpty( query.where ) ){
            query.where = {};
        }

        FXRequest.findAndCountAll( query ).done( function( err, fx_requests ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !fx_requests ){
                res.send( 404 );
                return next();
            }
            else{
                var totalPages = 1;
                if( paged ){
                    var pageRatio = fx_requests.count / req.params.per_page;
                    totalPages = Math.floor( pageRatio );
                    if( pageRatio % 1 > 0 ){
                        totalPages++;
                    }
                }
                res.send( 200, { fx_requests: fx_requests.rows, meta: { total_pages: totalPages } } );
                return next();
            }
        } );

    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.view = function( req, res, next ){
    FXRequest.find( {
        where: {
            id: req.params.fx_request_id
        }
    } ).done( function( err, request ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else if( !request ){
            res.send( 404 );
            return next();
        }
        else{
            res.send( 200, { fx_request: request } );
            return next();
        }
    } )

};

exports.search = function( req, res, next ){

    req.assert( 'value', 'isString' );


    if( _.isEmpty( req.validationErrors ) ){
        var query = {
            where: {},
            order: 'updated_at DESC'
        };
        var queryParams = [];
        req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
        req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );

        var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
        if( paged ){
            query.offset = ( req.params.page - 1 ) * req.params.per_page;
            query.limit = req.params.per_page;
        }

        req.params.value = req.params.value.trim();
        query.where = { name: { like: '%' + req.params.value + '%' } };

        FXRequest.findAndCountAll( query ).done( function( err, fx_requests ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                var totalPages = 1;
                if( paged ){
                    var pageRatio = fx_requests.count / req.params.per_page;
                    totalPages = Math.floor( pageRatio );
                    if( pageRatio % 1 > 0 ){
                        totalPages++;
                    }
                }

                res.send( 200, { fx_requests: fx_requests.rows, meta: { total_pages: totalPages } } );
                return next();
            }
        } );

    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};


exports.create = function( req, res, next ){
    req.assert( 'fxRequest', 'isObject' );
    req.assert( 'fxRequest.from_account_id', 'isString' );
    req.assert( 'fxRequest.base_amount', 'isNumber' );
    req.assert( 'fxRequest.counter_currency_id', 'isString' );
    req.assert( 'fxRequest.type', 'isNumber' );

    if( !_.isEmpty( req.validationErrors ) ){
        util.handleValidationErrors( req, res );
        return next();
    }
    else{

        db.sequelize.transaction( function( t ){

            Account.find( {
                where: [
                    { id: req.body.fxRequest.from_account_id }
                ]
            } )
                .done( function( err, account ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else if( !account ){
                        res.send( 400, { errors: [ 'Account not found.' ] } );
                        logger.error( 'account', 'Account with id of [' + req.body.fxRequest.from_account_id + '] not found', {
                            req: req
                        } );
                        return next();
                    }
                    else if( req.body.fxRequest.base_amount <= 0 ){
                        res.send( 400, {
                            errors: [
                                { 'fxRequest.base_amount': [ 'Amount must be greater than 0' ] }
                            ]
                        } );
                        logger.error( 'fx-request', 'Amount must be greater than 0', {
                            req: req
                        } );
                        return next();
                    }
                    else{
                        if( account.balance < req.body.fxRequest.base_amount ){
                            res.send( 400, { errors: [ 'Insufficient fund' ] } );
                            logger.error( 'fx-request', 'Account [' + account.id + '] has insufficient funds', {
                                req: req
                            } );
                            return next();
                        }

                        else{
                            account.balance = math.round( account.balance - req.body.fxRequest.base_amount, 2 );
                            account.save( { transaction: t } ).done( function( err ){
                                    if( !!err ){
                                        t.rollback();
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else{

                                        _this.getECBRates( req.body.fxRequest.base_currency_id )
                                            .then( function( baseRates ){
                                                return _this.feeRateCalc(
                                                    baseRates,
                                                    req.body.fxRequest.from_account_id,
                                                    req.body.fxRequest.base_currency_id,
                                                    req.body.fxRequest.counter_currency_id,
                                                    req.body.fxRequest.base_amount );
                                            } )
                                            .then( function( data ){
                                                // Admin overwrite
                                                if( !_.isEmpty( req.body.fxRequest.base_rate ) && !_.isEmpty( req.body.fxRequest.customer_rate ) ){

                                                    if( req.body.fxRequest.base_rate < req.body.fxRequest.customer_rate ){
                                                        t.rollback();
                                                        res.send( 400, { errors: [ 'Base rate must be greater than or equal to customer rate' ] } );
                                                        logger.error( 'fx-request', 'Base rate must be greater than or equal to customer rate', {
                                                            req: req
                                                        } );
                                                        return next();
                                                    }
                                                    data.base_rate = req.body.fxRequest.base_rate;
                                                    data.customer_rate = req.body.fxRequest.customer_rate;
                                                    data.counter_amount = math.round( req.body.fxRequest.base_amount * req.body.fxRequest.customer_rate, 2 );
                                                    data.cost_amount = math.round( data.counter_amount / req.body.fxRequest.base_rate, 2 );
                                                    data.fee_amount = req.body.fxRequest.base_amount - data.cost_amount;
                                                }

                                                var newFXRequest = FXRequest.build( {
                                                    name: hashids.encode( new Date().getTime() ),
                                                    from_account_id: req.body.fxRequest.from_account_id,
                                                    to_account_id: req.body.fxRequest.to_account_id,
                                                    base_currency_id: account.currency_id,
                                                    base_amount: req.body.fxRequest.base_amount,
                                                    counter_amount: data.counter_amount,
                                                    counter_currency_id: req.body.fxRequest.counter_currency_id,
                                                    notes: req.body.fxRequest.notes,
                                                    company_id: account.company_id,
                                                    type: req.body.fxRequest.type,
                                                    status: 0,
                                                    base_rate: data.base_rate,
                                                    customer_rate: data.customer_rate
                                                } );
                                                newFXRequest.save( { transaction: t } ).done( function( err ){
                                                    if( !!err ){
                                                        t.rollback();
                                                        _this.handleError( err, req, res );
                                                        return next();
                                                    }
                                                    else{
                                                        var chainer = new Sequelize.Utils.QueryChainer;

                                                        Currency.find( {
                                                            where: {
                                                                id: req.body.fxRequest.base_currency_id
                                                            }
                                                        } )
                                                            .done( function( err, currency ){
                                                                if( !!err ){
                                                                    t.rollback();
                                                                    _this.handleError( err, req, res );
                                                                    return next();
                                                                }
                                                                else{
                                                                    // Create Transaction(s)
                                                                    var fxTransaction = Transaction.build( {
                                                                        currency_id: account.currency_id,
                                                                        from_account_id: req.body.fxRequest.from_account_id,
                                                                        to_account_id: currency.fx_account_id,
                                                                        model: 'fx-request',
                                                                        model_id: newFXRequest.id,
                                                                        amount: req.body.fxRequest.base_amount,
                                                                        type: 9,
                                                                        status: 0
                                                                    } );

                                                                    fxTransaction.save( { transaction: t } ).done( function( err ){
                                                                        if( !!err ){
                                                                            t.rollback();
                                                                            _this.handleError( err, req, res );
                                                                            return next();
                                                                        }
                                                                        else{
                                                                            t.commit();
                                                                            res.send( 201, { fxRequest: newFXRequest } );
                                                                            logger.info( 'fx-request', 'New fx request has been created for company [' + account.company_id + ']', {
                                                                                req: req,
                                                                                model: 'fx-request',
                                                                                model_id: newFXRequest.id
                                                                            } );
                                                                            return next();
                                                                        }
                                                                    } );
                                                                }
                                                            } );
                                                    }
                                                } );
                                            } )
                                    }
                                }
                            );
                        }
                    }
                } );

        } );

    }
};

exports.getECBRates = function( base ){
    return new Promise( function( resolve, reject ){
        var baseCurrency = 'USD';
        if( !_.isEmpty( base ) ){
            baseCurrency = base;
        }

        var rates = {};

        // Temporary function which returns daily FX rates from ECB. Base currency is EUR;
        request( {
                method: 'GET',
                url: 'http://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml'
            },
            function( error, response, body ){
                if( !!error ){
                    res.send( 400, {} );
                    return next();
                }
                else{
                    var ecbData = xmlParser.toJson( body, { object: true } );
                    var ecbRates = ecbData[ 'gesmes:Envelope' ][ 'Cube' ][ 'Cube' ][ 'Cube' ];
                    ecbRates.push( { currency: 'EUR', rate: '1.00' } ); //ECB rate base is EURO

                    _.forEach( ecbRates, function( ecbR ){
                        rates[ ecbR.currency ] = Number( ecbR.rate );
                    } );

                    var baseRates = {};
                    // Convert everything to be based in BASE currency
                    _.forEach( rates, function( rate, key ){
                        baseRates[ key ] = math.round( rate / rates[ baseCurrency ], 6 );
                    } );

                    resolve( baseRates );
                }
            }
        );
    } );
};

exports.feeRateCalc = function( baseRates, from_account_id, base, counter, amount ){
    return new Promise( function( resolve, reject ){
        Account.find( {
            where: {
                id: from_account_id
            },
            include: [
                {
                    model: Company,
                    include: [ Fee ]
                }
            ]
        } ).done( function( err, fromAccount ){
            if( !_.isEmpty( fromAccount ) ){
                var feeTable = fromAccount.company.fee.getFxRates();
            }

            // Convert fee table to base currency based
            if( base && base !== 'USD' ){
                // Convert table to USD based
                var newFeeTable = {};
                _.forEach( feeTable, function( value, key ){
                    var newKey = Math.round( key / baseRates[ 'USD' ] );
                    newFeeTable[ newKey ] = value;
                } );
                feeTable = newFeeTable;
            }

            // Return appropriate rate based on amount
            var newAmount = Number( amount );
            var feeRate = 0;
            _.forEach( feeTable, function( value, key ){
                if( newAmount >= Number( key ) ){
                    feeRate = value;
                }
            } );

            // Final customer rate
            var customerRate = math.round( baseRates[ counter ] * ( 1 - feeRate ), 6 );
            var counterAmount = math.round( amount * customerRate, 2 );

            // Figure out the counter currency amount
            var costAmount = math.round( counterAmount / baseRates[ counter ], 2 );
            var feeAmount = math.round( amount - costAmount, 2 );

            resolve( {
                rates: baseRates,
                base_amount: amount,
                counter_amount: counterAmount,
                customer_rate: customerRate,
                base_rate: baseRates[ counter ],
                cost_amount: costAmount,
                fee_amount: feeAmount
            } );
        } );
    } );
};

exports.getRates = function( req, res, next ){

    req.assert( 'amount', 'isNumerical' );
    req.assert( 'base_currency_id', 'isString' );
    req.assert( 'counter_currency_id', 'isString' );
    req.assert( 'from_account_id', 'isString' );

    if( !_.isEmpty( req.validationErrors ) ){
        util.handleValidationErrors( req, res );
        return next();
    }
    else{
        // From account (fee_fx will be store in the account)
        // amount (fx fees will change based on amount)

        _this.getECBRates( req.params.base_currency_id )
            .then( function( baseRates ){
                return _this.feeRateCalc( baseRates, req.params.from_account_id, req.params.base_currency_id, req.params.counter_currency_id, req.params.amount );
            } )
            .then( function( data ){
                res.send( 200, data );
                return next();
            } );
    }
};

exports.start = function( req, res, next ){

    FXRequest.find( {
        where: {
            id: req.params.fx_request_id,
            status: 0
        }
    } ).then( function( fxRequest ){
        if( !fxRequest ){
            res.send( 404 );
            logger.error( 'fx-request', 'Fx-request with id of [' + req.params.fx_request_id + '] not found', {
                req: req
            } );
            return next();
        }
        else{
            fxRequest.status = 1;
            fxRequest.save().then( function(){
                res.send( 200, { fx_request: fxRequest } );
                logger.info( 'fx-request', 'Fx has been started', {
                    req: req,
                    model: 'fx-request',
                    model_id: fxRequest.id
                } );
                return next();
            } );
        }
    } ).catch( function( err ){
        _this.handleError( err, req, res );
        return next();
    } )


};


exports.complete = function( req, res, next ){
    req.assert( 'data', 'isObject' );
    req.assert( 'data.reference', 'isString' );
    req.assert( 'data.confirmation', 'isString' );
    req.assert( 'data.to_account_id', 'isString' );
    req.assert( 'data.debited_amount', 'isNumber' );
    req.assert( 'data.credited_amount', 'isNumber' );

    db.sequelize.transaction( function( t ){
        // issue finding company_id??!!
        return FXRequest.find( {
            where: {
                id: req.params.fx_request_id
            }
        } ).then( function( fx_request ){
            if( !fx_request ){
                res.send( 404 );
                logger.error( 'fx-request', 'Fx-request with id of [' + req.params.fx_request_id + '] not found', {
                    req: req
                } );
                return next();
            }
            else{
                var promises = [];

                promises.push( Currency.find( {
                    where: {
                        id: fx_request.base_currency_id
                    }
                } ) );

                promises.push( Currency.find( {
                    where: {
                        id: fx_request.counter_currency_id
                    }
                } ) );

                return Promise.all( promises ).then( function( results ){
                    var baseCurrency = results[ 0 ];
                    var counterCurrency = results[ 1 ];
                    promises = [];

                    promises.push( Account.find( {
                        where: {
                            id: baseCurrency.fx_account_id
                        }
                    } ) );

                    promises.push( Account.find( {
                        where: {
                            id: baseCurrency.fee_fx_account_id
                        }
                    } ) );

                    promises.push( Account.find( {
                        where: {
                            id: counterCurrency.fx_account_id
                        }
                    } ) );

                    promises.push( Account.find( {
                        where: {
                            id: counterCurrency.fee_fx_account_id
                        }
                    } ) );

                    promises.push( Account.find( {
                        where: {
                            id: req.params.data.to_account_id,
                            company_id: fx_request.company_id,
                            currency_id: fx_request.counter_currency_id
                        }
                    } ) );

                    return Promise.all( promises ).then( function( results ){
                        var baseFXAccount = results[ 0 ];
                        var baseFeeAccount = results[ 1 ];
                        var counterFXAccount = results[ 2 ];
                        var counterFeeAccount = results[ 3 ];
                        var toAccount = results[ 4 ];
                        promises = [];

                        if( !toAccount ){
                            res.send( 400, { errors: [ 'Account not found.' ] } );
                            logger.error( 'fx-request', 'Account with id of [' + req.params.data.to_account_id + '] not found', {
                                req: req
                            } );
                            return next();
                        }
                        else{
                            // Base currency operations
                            if( baseFXAccount.balance < fx_request.base_amount ||  baseFXAccount.balance < req.body.data.debited_amount ){
                                res.send( 400, { errors: [ 'Insufficient funds in ' + baseFXAccount.id ] } );
                                logger.error( 'fx-request', 'Account [' + baseFXAccount.id + '] has insufficient funds', {
                                    req: req
                                } );
                                return next();
                            }
                            else if( fx_request.base_amount === req.body.data.debited_amount ){
                                // Match, wire all base amount out

                                var fxOutTransaction = Transaction.build( {
                                    currency_id: fx_request.base_currency_id,
                                    from_account_id: baseFXAccount.id,
                                    model: 'fx-request',
                                    model_id: fx_request.id,
                                    amount: fx_request.base_amount,
                                    type: 9,
                                    status: 1
                                } );
                                promises.push( fxOutTransaction.save( { transaction: t } ) );
                                promises.push( baseFXAccount.balanceSub( fx_request.base_amount, t ) );
                            }
                            else if( fx_request.base_amount > req.body.data.debited_amount ){
                                // Bank took less, send debited amount out and send the rest to fee

                                var fxOutTransaction = Transaction.build( {
                                    currency_id: fx_request.base_currency_id,
                                    from_account_id: baseFXAccount.id,
                                    model: 'fx-request',
                                    model_id: fx_request.id,
                                    amount: req.body.data.debited_amount,
                                    type: 9,
                                    status: 1
                                } );

                                var baseFeeTransaction = Transaction.build( {
                                    currency_id: fx_request.base_currency_id,
                                    from_account_id: baseFXAccount.id,
                                    to_account_id: baseFeeAccount.id,
                                    model: 'fx-request',
                                    model_id: fx_request.id,
                                    amount: math.round( fx_request.base_amount - req.body.data.debited_amount, 2 ),
                                    type: 3,
                                    status: 0
                                } );
                                promises.push( fxOutTransaction.save( { transaction: t } ) );
                                promises.push( baseFeeTransaction.save( { transaction: t } ) );
                                promises.push( baseFXAccount.balanceSub( fx_request.base_amount, t ) );
                            }
                            else{
                                // Bank took more, transfer diff from fee and send debited amount out
                                if( baseFeeAccount.balance < math.round( req.body.data.debited_amount - fx_request.base_amount, 2 ) ){
                                    res.send( 400, { errors: [ 'Insufficient funds in ' + baseFeeAccount.id ] } );
                                    logger.error( 'fx-request', 'Account [' + baseFeeAccount.id + '] has insufficient funds', {
                                        req: req
                                    } );
                                    return next();
                                }

                                var baseFeeTransaction = Transaction.build( {
                                    currency_id: fx_request.base_currency_id,
                                    from_account_id: baseFeeAccount.id,
                                    to_account_id: baseFXAccount.id,
                                    model: 'fx-request',
                                    model_id: fx_request.id,
                                    amount: math.round( req.body.data.debited_amount - fx_request.base_amount, 2 ),
                                    type: 3,
                                    status: 1
                                } );

                                var fxOutTransaction = Transaction.build( {
                                    currency_id: fx_request.base_currency_id,
                                    from_account_id: baseFXAccount.id,
                                    model: 'fx-request',
                                    model_id: fx_request.id,
                                    amount: req.body.data.debited_amount,
                                    type: 9,
                                    status: 1
                                } );

                                promises.push( baseFeeAccount.balanceSub( math.round( req.body.data.debited_amount - fx_request.base_amount, 2 ), t ) );
                                promises.push( baseFeeTransaction.save( { transaction: t } ) );
                                promises.push( fxOutTransaction.save( { transaction: t } ) );
                                promises.push( baseFXAccount.balanceSub( fx_request.base_amount, t ) );
                            }

                            // Counter currency operations
                            if( counterFXAccount.balance < req.body.data.credited_amount ){
                                res.send( 400, { errors: [ 'Insufficient funds in ' + counterFXAccount.id ] } );
                                logger.error( 'fx-request', 'Account [' + counterFXAccount.id + '] has insufficient funds', {
                                    req: req
                                } );
                                return next();
                            }
                            else if( fx_request.counter_amount === req.body.data.credited_amount ){
                                    // Send counter amount to client
                                    promises.push( counterFXAccount.balanceSub( fx_request.counter_amount, t ) );

                            }
                            else if( fx_request.counter_amount < req.body.data.credited_amount ){
                                // Send counter amount to client, extra to counter fee
                                var counterFeeTransaction = Transaction.build( {
                                    currency_id: fx_request.counter_currency_id,
                                    from_account_id: counterFXAccount.id,
                                    to_account_id: counterFeeAccount.id,
                                    model: 'fx-request',
                                    model_id: fx_request.id,
                                    amount: math.round( req.body.data.credited_amount - fx_request.counter_amount, 2 ),
                                    type: 3,
                                    status: 0
                                } );

                                promises.push( counterFeeTransaction.save( { transaction: t } ) );
                                promises.push( counterFXAccount.balanceSub( req.body.data.credited_amount, t ) );
                            }
                            else{
                                if( counterFeeAccount.balance < math.round( fx_request.counter_amount - req.body.data.credited_amount, 2 ) ){
                                    res.send( 400, { errors: [ 'Insufficient funds in ' + counterFeeAccount.id ] } );
                                    logger.error( 'fx-request', 'Account [' + counterFeeAccount.id + '] has insufficient funds', {
                                        req: req
                                    } );
                                    return next();
                                }

                                // Transfer diff from counter fee, Send counter amount to client
                                var counterFeeTransaction = Transaction.build( {
                                    currency_id: fx_request.counter_currency_id,
                                    from_account_id: counterFeeAccount.id,
                                    to_account_id: counterFXAccount.id,
                                    model: 'fx-request',
                                    model_id: fx_request.id,
                                    amount: math.round( fx_request.counter_amount - req.body.data.credited_amount, 2 ),
                                    type: 3,
                                    status: 1
                                } );

                                promises.push( counterFeeAccount.balanceSub( math.round( fx_request.counter_amount - req.body.data.credited_amount, 2 ), t ) );
                                promises.push( counterFeeTransaction.save( { transaction: t } ) );
                                promises.push( counterFXAccount.balanceSub( req.body.data.credited_amount, t ) );
                            }
                            var clientTransaction = Transaction.build( {
                                currency_id: fx_request.counter_currency_id,
                                from_account_id: counterCurrency.fx_account_id,
                                to_account_id: toAccount.id,
                                model: 'fx-request',
                                model_id: fx_request.id,
                                amount: fx_request.counter_amount,
                                type: 9,
                                status: 0
                            } );
                            promises.push( clientTransaction.save( { transaction: t } ) );

                            fx_request.status = 2;
                            fx_request.to_account_id = req.params.data.to_account_id;
                            fx_request.reference = req.params.data.reference;
                            fx_request.confirmation = req.params.data.confirmation;
                            promises.push( fx_request.save( { transaction: t } ) );

                            return Promise.all( promises ).then( function(){
                                t.commit();
                                res.send( 200, { fx_request: fx_request } );
                                logger.info( 'fx-request', 'Fx-request has been completed: ' + JSON.stringify( req.body.data ), {
                                    req: req,
                                    model: 'fx-request',
                                    model_id: fx_request.id
                                } );
                                return next();
                            } ).catch( function( err ){
                                t.rollback();
                                _this.handleError( err, req, res );
                                return next();
                            } )

                        }
                    } );

                } );
            }
        } ).catch( function( err ){
            _this.handleError( err, req, res );
            return next();
        } );

    } );

};


exports.debitCost = function(){

};


exports.cancel = function( req, res, next ){

    FXRequest.find( {
        where: {
            id: req.params.fx_request_id
        }
    } ).done( function( err, fx_request ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else if( !fx_request ){
            res.send( 400, { errors: [ 'FX Request not found.' ] } );
            return next();
        }
        else if( fx_request.status !== 0 ){
            res.send( 400, { errors: [ 'Only new FX Request can be cancelled.' ] } );
            return next();
        }
        else{
            db.sequelize.transaction( function( t ){
                var fromAccount = null;
                var toAccount = null;
                var fxTrans = null;
                var transactionCompleted = false;
                fx_request.status = 3;
                fx_request.save( { transaction: t } )
                    .then( function(){
                        return Transaction.find( {
                            where: {
                                model: 'fx-request',
                                model_id: fx_request.id,
                                status: [ 0, 1 ]
                            }
                        } )
                    } )
                    .then( function( trans ){
                        fxTrans = trans;
                        if( fxTrans ){
                            transactionCompleted = fxTrans.status === 1;
                            fxTrans.status = 2;
                            return fxTrans.save( { transaction: t } )
                                .then( function(){
                                    return Account.find( { where: { id: fxTrans.from_account_id } } );
                                } )
                                .then( function( acct ){
                                    fromAccount = acct;
                                    return Account.find( { where: { id: fxTrans.to_account_id } } );
                                } )
                                .then( function( acct ){
                                    toAccount = acct;
                                    if( toAccount.balance < fxTrans.amount ){
                                        res.send( 400, { errors: [ 'Insufficient fund to cancel the FX Request' ] } );
                                        return next();
                                    }
                                    return Account.update(
                                        {
                                            balance: fromAccount.balance + fxTrans.amount
                                        },
                                        {
                                            id: fromAccount.id,
                                            balance: fromAccount.balance
                                        },
                                        { transaction: t }
                                    )
                                        .then( function( rowsAffected ){
                                            if( rowsAffected === 1 ){
                                                if( transactionCompleted ){
                                                    return Account.update(
                                                        {
                                                            balance: toAccount.balance - fxTrans.amount
                                                        },
                                                        {
                                                            id: toAccount.id,
                                                            balance: toAccount.balance
                                                        },
                                                        { transaction: t }
                                                    ).then( function( rowsAffected ){
                                                        if( rowsAffected === 1 ){
                                                            t.commit();
                                                            res.send( 200, { fx_request: fx_request } );
                                                            return next();
                                                        }
                                                        else{
                                                            t.rollback();
                                                            res.send( 400, { errors: [ 'An error has occurred' ] } );
                                                            return next();
                                                        }
                                                    } );
                                                }
                                                else{
                                                    t.commit();
                                                    res.send( 200, { fx_request: fx_request } );
                                                    return next();
                                                }
                                            }
                                            else{
                                                t.rollback();
                                                res.send( 400, { errors: [ 'An error has occurred' ] } );
                                                return next();
                                            }
                                        } )
                                } )
                        }
                        else{
                            t.commit();
                            res.send( 200, { fx_request: fx_request } );
                            return next();
                        }
                    } )
                    .catch( function( err ){
                        _this.handleError( err, req, res );
                        return next();
                    } );
            } );
        }
    } );
};