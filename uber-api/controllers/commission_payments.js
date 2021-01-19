


var Sequelize = require( 'sequelize' );
var _ = require( 'lodash' );
var db = require( '../models' );
var Commission = db.Commission;
var CommissionPayment = db.CommissionPayment;
var Account = db.Account;
var Transaction = db.Transaction;
var Currency = db.Currency;

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'commission', err, req, res );
};






exports.index = function( req, res, next ){
    var query = {
        where: {},
        order: [
            [ 'updated_at', 'DESC' ]
        ]
    };

    req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
    req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );

    var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
    if( paged ){
        query.offset = ( req.params.page - 1 ) * req.params.per_page;
        query.limit = req.params.per_page;
    }

    var validFields = [ 'affiliate_id', 'status' ];
    _.forEach( validFields, function( field ){
        if( _.has( req.params, field ) ){
            query.where[ field ] = req.params[ field ];
        }
    } );

    if( _.isEmpty( req.validationErrors ) ){
        CommissionPayment.findAndCountAll( query )
            .done( function( err, cps ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{
                    var totalPages = 1;
                    if( paged ){
                        var pageRatio = cps.count / req.params.per_page;
                        totalPages = Math.floor( pageRatio );
                        if( pageRatio % 1 > 0 ){
                            totalPages++;
                        }
                    }
                    res.send( 200, { commissionPayments: cps.rows, meta: { total_pages: totalPages } } );
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
    req.assert( 'commission_payment_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        var query = {
            where: [ {
                id: req.params.commission_payment_id
            } ]
        };

        CommissionPayment.find( query ).done( function( err, commissionPayment ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !commissionPayment ){
                res.send( 404 );
                return next();
            }
            else{
                res.send( 200, { commissionPayment: commissionPayment } );
                return next();
            }
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }

};





exports.approve = function( req, res, next ){
    req.assert( 'data', 'isObject' );
    req.assert( 'data.account_id', 'isString' );
    req.assert( 'commission_payment_id', 'isString' );
    if( _.isEmpty( req.validationErrors ) ){

        db.sequelize.transaction( function( t ){

            CommissionPayment.find( {
                where: {
                    id: req.params.commission_payment_id
                }
            } ).done( function( err, theCommission ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !theCommission ){
                    res.send( 404 );
                    logger.error( 'commission-payment', 'No commission payment was found with id of [' + req.params.commission_payment_id + ']', {
                        req: req
                    } );
                    return next();
                }
                else{
                    var chainer = new Sequelize.Utils.QueryChainer;
                    // find the currency row appropriate
                    chainer.add( Currency.find( {
                        where: {
                            id: theCommission.currency_id
                        }
                    } ) );
                    // find the affiliate account that the money will goto
                    chainer.add( Account.find( {
                        where: {
                            company_id: theCommission.affiliate_id,
                            currency_id: theCommission.currency_id,
                            id: req.params.data.account_id
                        }
                    } ) );
                    chainer.runSerially().done( function( err, results ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else{
                            var theCurrency = results[ 0 ];
                            var affiliateAccount = results[ 1 ];

                            if( !theCurrency ){
                                res.send( 400, { errors: [ 'Invalid currency' ] } );
                                logger.error( 'commission-payment', 'Invalid currency for commission payment [' + theCommission.id + ']', {
                                    req: req
                                } );
                                return next();
                            }
                            else if( !affiliateAccount ){
                                res.send( 400, { errors: [ 'Invalid target account_id' ] } );
                                logger.error( 'commission-payment', 'No account was found for commission payment  [' + theCommission.id + ']', {
                                    req: req
                                } );
                                return next();
                            }

                            Account.find( {
                                where: {
                                    id: theCurrency.commission_account_id
                                }
                            } ).done( function( err, akirixCommissionAccount ){
                                if( !!err ){
                                    _this.handleError( err, req, res );
                                    return next();
                                }

                                else if( akirixCommissionAccount.values.balance >= theCommission.values.amount ){
                                    Account.update(
                                        {
                                            balance: akirixCommissionAccount.values.balance - theCommission.values.amount
                                        },
                                        {
                                            id: akirixCommissionAccount.id,
                                            balance: akirixCommissionAccount.balance
                                        }
                                        , { transaction: t } ).success( function( affectedRows ){
                                        if( affectedRows === 1 ){
                                            var commissionTransaction = Transaction.build( {
                                                parent_id: null,
                                                currency_id: theCommission.currency_id,
                                                from_account_id: akirixCommissionAccount.id,
                                                to_account_id: affiliateAccount.id,
                                                model: 'commission-payment',
                                                model_id: theCommission.id,
                                                amount: theCommission.amount,
                                                type: 8,
                                                status: 0
                                            } );

                                            // save transaction
                                            commissionTransaction.save( { transaction: t } ).done( function( err, commissionPaymentTransaction ){
                                                if( !!err ){
                                                    t.rollback();
                                                    _this.handleError( err, req, res );
                                                    return next();
                                                }
                                                else{
                                                    // change the commission payment status
                                                    theCommission.status = 1;
                                                    theCommission.uber_user_id = req.user.id;
                                                    theCommission.save( { transaction: t } ).done( function( err ){
                                                        if( !!err ){
                                                            t.rollback();
                                                            _this.handleError( err, req, res );
                                                            return next();
                                                        }
                                                        else{
                                                            t.commit();
                                                            res.send( 200, { commission: theCommission } );
                                                            logger.info( 'commission-payment', 'Commission payment has been approved', {
                                                                req: req,
                                                                model: 'commission-payment',
                                                                model_id: theCommission.id
                                                            } );
                                                            return next();
                                                        }
                                                    } )
                                                }
                                            } );
                                        }
                                    } ).error( function( err ){
                                        t.rollback();
                                        _this.handleError( err, req, res );
                                        return next();
                                    } );

                                    //akirixCommissionAccount.values.balance = ( akirixCommissionAccount.values.balance - theCommission.values.amount );
                                    //akirixCommissionAccount.save().done( function( err ){
                                    //    if( !!err ){
                                    //        _this.handleError( err, req, res );
                                    //        return next();
                                    //    }
                                    //    else{
                                    //        // build a transaction
                                    //        var commissionTransaction = Transaction.build( {
                                    //            parent_id: null,
                                    //            currency_id: theCommission.currency_id,
                                    //            from_account_id: akirixCommissionAccount.id,
                                    //            to_account_id: affiliateAccount.id,
                                    //            model: 'commission-payment',
                                    //            model_id: theCommission.id,
                                    //            amount: theCommission.amount,
                                    //            type: 8,
                                    //            status: 0
                                    //        } );
                                    //
                                    //        // save transaction
                                    //        commissionTransaction.save().done( function( err, commissionPaymentTransaction ){
                                    //            if( !!err ){
                                    //                _this.handleError( err, req, res );
                                    //                return next();
                                    //            }
                                    //            else{
                                    //                // change the commission payment status
                                    //                theCommission.status = 1;
                                    //                theCommission.uber_user_id = req.user.id;
                                    //                theCommission.save().done( function( err ){
                                    //                    if( !!err ){
                                    //                        _this.handleError( err, req, res );
                                    //                        return next();
                                    //                    }
                                    //                    else{
                                    //                        res.send( 200, { commission: theCommission } );
                                    //                        return next();
                                    //                    }
                                    //                } )
                                    //            }
                                    //        } );
                                    //    }
                                    //} )
                                }
                                else{
                                    t.rollback();
                                    res.send( 400, { errors: [ 'The balance on the akirix commission account is too low to process this payment ' + theCommission.currency_id + ' currency.' ] } );
                                    logger.error( 'commission-payment', 'The balance on the akirix commission account [' + akirixCommissionAccount.id + '] is too low to process this payment', {
                                        req: req
                                    } );
                                    return next();
                                }
                            } )
                        }
                    } )

                }
            } )

        } );


    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};






exports.deny = function( req, res, next ){
    req.assert( 'commission_payment_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        CommissionPayment.find( {
            where: {
                id: req.params.commission_payment_id
            }
        } ).done( function( err, commissionToDeny ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                commissionToDeny.uber_user_id = req.user.id;
                commissionToDeny.status = 2;
                commissionToDeny.save().done( function( err ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else{
                        res.send( 200, { commissionPayment: commissionToDeny } );
                        logger.info( 'commission-payment', 'Commission payment has been denied', {
                            req: req,
                            model: 'commission-payment',
                            model_id: commissionToDeny.id
                        } );
                        return next();
                    }
                } );
            }
        } )
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};
