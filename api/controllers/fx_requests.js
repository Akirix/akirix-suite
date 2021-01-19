


var Sequelize = require( 'sequelize' );
var _ = require( 'lodash' );
var math = require( 'mathjs' );
var request = require( 'request' );
var xmlParser = require( 'xml2json' );

var db = require( '../models' );
var FXRequest = db.FXRequest;
var Company = db.Company;
var User = db.User;
var Account = db.Account;
var Transaction = db.Transaction;
var Currency = db.Currency;

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

var Promise = require( 'promise' );


exports.handleError = function( err, req, res ){
    util.handleError( 'fxRequest', err, req, res );
};


exports.index = function( req, res, next ){

    FXRequest.findAll( {
        where: {
            company_id: req.user.company_id
        },
        order: [
            [ 'status', 'ASC' ],
            [ 'created_at', 'DESC' ]
        ]
    } ).done( function( err, fx_requests ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else if( !fx_requests ){
            res.send( 200, { fx_requests: [] } );
            return next();
        }
        else{
            res.send( 200, { fx_requests: fx_requests } );
            return next();
        }
    } )

};


exports.view = function( req, res, next ){
    FXRequest.find( {
        where: {
            id: req.params.fx_request_id,
            company_id: req.user.company_id
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


exports.create = function( req, res, next ){
    req.assert( 'fxRequest', 'isObject' );
    req.assert( 'fxRequest.from_account_id', 'isString' );
    req.assert( 'fxRequest.base_amount', 'isNumber' );
    req.assert( 'fxRequest.counter_currency_id', 'isString' );

    if( !_.isEmpty( req.validationErrors ) ){
        util.handleValidationErrors( req, res );
        return next();
    }
    else{
        Account.find( {
                where: [
                    { id: req.body.fxRequest.from_account_id },
                    { company_id: req.user.company_id }
                ]
            } )
            .done( function( err, account ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !account ){
                    res.send( 400, { errors: [ 'Account not found.' ] } );
                    logger.error( 'fx-request', 'Account not found using account id [' + req.body.fxRequest.from_account_id + ']', {
                        req: req
                    } );
                    return next();
                }
                else if( req.body.fxRequest.base_amount <= 0 ){
                    res.send( 400, {
                        errors: [ { 'fxRequest.base_amount': [ 'Amount must be greater than 0' ] } ]
                    } );
                    logger.error( 'fx-request', 'fx request amount is <= 0', {
                        req: req
                    } );
                    return next();
                }
                else{
                    if( account.balance < req.body.fxRequest.base_amount ){
                        res.send( 400, { errors: [ 'Insufficient fund' ] } );
                        logger.error( 'fx-request', 'insufficient funds', {
                            req: req
                        } );
                        return next();
                    }

                    else{
                        account.balance = math.round( account.balance - req.body.fxRequest.base_amount, 2 );
                        account.save().done( function( err ){
                                if( !!err ){
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else{

                                    _this.getECBRates( account.currency_id )
                                        .then( function( baseRates ){
                                            return _this.feeRateCalc(
                                                baseRates,
                                                req.body.fxRequest.from_account_id,
                                                account.currency_id,
                                                req.body.fxRequest.counter_currency_id,
                                                req.body.fxRequest.base_amount );
                                        } )
                                        .then( function( data ){
                                            var newFXRequest = FXRequest.build( {
                                                from_account_id: req.body.fxRequest.from_account_id,
                                                to_account_id: req.body.fxRequest.to_account_id,
                                                base_currency_id: account.currency_id,
                                                base_amount: req.body.fxRequest.base_amount,
                                                counter_amount: data.counter_amount,
                                                counter_currency_id: req.body.fxRequest.counter_currency_id,
                                                notes: req.body.fxRequest.notes,
                                                company_id: req.user.company_id,
                                                type: 0,
                                                status: 0,
                                                base_rate: data.base_rate,
                                                customer_rate: data.customer_rate
                                            } );
                                            newFXRequest.save().done( function( err ){
                                                if( !!err ){
                                                    _this.handleError( err, req, res );
                                                    return next();
                                                }
                                                else{


                                                    var chainer = new Sequelize.Utils.QueryChainer;

                                                    Currency.find( { where: { id: account.currency_id } } ).done( function( err, currency ){
                                                        if( !!err ){
                                                            console.log( err );
                                                        }
                                                        else{
                                                            // Create Transaction(s)
                                                            var fxTransaction = Transaction.build( {
                                                                currency_id: account.currency_id,
                                                                from_account_id: req.body.fxRequest.from_account_id,
                                                                to_account_id: currency.fx_account_id,
                                                                model: 'fx-request',
                                                                model_id: newFXRequest.id,
                                                                amount: data.cost_amount,
                                                                type: 9,
                                                                status: 0
                                                            } );


                                                            chainer.add( fxTransaction.save() );
                                                            if( data.fee_amount > 0 ){
                                                                // create fee transaction
                                                                var fxFeeTransaction = Transaction.build( {
                                                                    parent_id: fxTransaction.id,
                                                                    currency_id: account.currency_id,
                                                                    from_account_id: req.body.fxRequest.from_account_id,
                                                                    to_account_id: currency.fee_account_id,
                                                                    model: 'fx-request',
                                                                    model_id: newFXRequest.id,
                                                                    amount: data.fee_amount,
                                                                    type: 3,
                                                                    status: 0
                                                                } );
                                                                chainer.add( fxFeeTransaction.save() );
                                                            }

                                                            chainer.runSerially().done( function( err ){
                                                                if( !!err ){
                                                                    _this.handleError( err, req, res );
                                                                    return next();
                                                                }
                                                                else{
                                                                    logger.info( 'fx-request', 'Fx-request [' + newFXRequest.id + '] has been created', {
                                                                        req: req,
                                                                        model: 'fx-request',
                                                                        model_id: newFXRequest.id
                                                                    } );
                                                                    res.send( 201, { fxRequest: newFXRequest } );

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
                    console.log( error );
                    console.log( response );
                    reject( error );
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
            }
        } ).done( function( err, fromAccount ){

            if( !_.isEmpty( fromAccount ) ){
                var feeTable = JSON.parse( fromAccount.fee_fx );
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

        _this.getECBRates( req.params.base, req.params.counter, req.params.amount )
            .then( function( baseRates ){
                return _this.feeRateCalc( baseRates, req.params.from_account_id, req.params.base_currency_id, req.params.counter_currency_id, req.params.amount );
            } )
            .then( function( data ){
                delete data.fee_amount;
                delete data.cost_amount;
                res.send( 200, data );
                return next();
            } )
            .catch( function( error ){
                res.send( 400, { errors: [ 'An error has occurred' ] } );
                return next();
            } );
    }
};
