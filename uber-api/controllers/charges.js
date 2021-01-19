

var Sequelize = require( 'sequelize' );
var db = require( '../models' );
var _ = require( 'lodash' );
var Promise = require( 'bluebird' );
var Charge = db.Charge;
var Transaction = db.Transaction;
var Account = db.Account;
var Currency = db.Currency;

var moment = require( 'moment-timezone' );

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;



exports.handleError = function( err, req, res ){
    util.handleError( 'document', err, req, res );
};




exports.index = function( req, res, next ){
    var query = {
        where: {},
        order: [
            [ 'status', 'ASC' ],
            [ 'type', 'DESC' ],
            [ 'created_at', 'DESC' ],
        ]
    };
    req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
    req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );
    var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
    if( paged ){
        query.offset = ( req.params.page - 1 ) * req.params.per_page;
        query.limit = req.params.per_page;
    }
    var validFields = [ 'status', 'type', 'company_id' ];
    _.forEach( validFields, function( field ){
        if( _.has( req.params, field ) ){
            query.where[ field ] = req.params[ field ];
        }
    } );
    if( _.isEmpty( req.validationErrors ) ){
        Charge.findAndCountAll( query )
            .done( function( err, charges ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{
                    var totalPages = 1;
                    if( paged ){
                        var pageRatio = charges.count / req.params.per_page;
                        totalPages = Math.floor( pageRatio );
                        if( pageRatio % 1 > 0 ){
                            totalPages++;
                        }
                    }
                    res.send( 200, { charges: charges.rows, meta: { total_pages: totalPages } } );
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
    req.assert( 'charge', 'isObject' );
    req.assert( 'charge.account_id', 'isString' );
    req.assert( 'charge.type', 'isNumber' );
    req.assert( 'charge.amount', 'isNumber' );
    req.assert( 'charge.start_date', 'isDate' );
    req.assert( 'charge.title', 'isString' );
    req.assert( 'charge.frequency', 'isNumber' );
    req.assert( 'charge.frequency_type', 'isString' );
    req.assert( 'charge.company_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Account.find( {
            where: {
                id: req.body.charge.account_id,
                company_id: req.body.charge.company_id
            }
        } ).done( function( err, acc ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            if( !acc ){
                res.send( 404 );
                return next();
            }
            else{
                var newCharge = Charge.build( {
                    currency_id: acc.currency_id,
                    start_date: req.body.charge.start_date,
                    next_payment_date: req.body.charge.start_date,
                    account_id: acc.id,
                    company_id: acc.company_id,
                    type: req.body.charge.type,
                    amount: req.body.charge.amount,
                    title: req.body.charge.title,
                    frequency: req.body.charge.frequency,
                    frequency_type: req.body.charge.frequency_type,
                    status: 0,
                    fee_counter: 0,
                    notes: req.body.charge.notes
                } );

                newCharge.save().done( function( err, newCharge ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else{
                        res.send( 201, { charge: newCharge } );
                        logger.info( 'charge', 'Charge Created [' + newCharge.id + '][ ' + newCharge.company_id + ']', {
                            req: req,
                            model: 'charge',
                            model_id: newCharge.id
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



exports.view = function( req, res, next ){
    req.assert( 'charge_id', 'isString' );
    if( _.isEmpty( req.validationErrors ) ){

        Charge.find( {
            where: {
                id: req.params.charge_id
            }
        } )
            .done( function( err, charge ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !charge ){
                    res.send( 404, { errors: [ 'No item found' ] } );
                    return next();
                }
                else{
                    res.send( 200, { charge: charge } );
                    return next();
                }
            } );

    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};




//exports.update = function( req, res, next ){
//    req.assert( 'charge_id', 'isString' );
//    req.assert( 'charge', 'isObject' );
//    req.assert( 'charge.account_id', 'isString' );
//    req.assert( 'charge.company_id', 'isString' );
//    req.assert( 'charge.type', 'isNumber' );
//    req.assert( 'charge.amount', 'isNumber' );
//    req.assert( 'charge.start_date', 'isDate' );
//    req.assert( 'charge.title', 'isString' );
//    req.assert( 'charge.frequency', 'isNumber' );
//    req.assert( 'charge.frequency_type', 'isNumber' );
//    req.assert( 'charge.status', 'isNumber' );
//
//    if( _.isEmpty( req.validationErrors ) ){
//        db.sequelize.transaction( function( t ){
//            Charge.find( {
//                where: {
//                    id: req.params.charge_id
//                }
//            } ).done( function( err, charge ){
//                if( !!err ){
//                    t.rollback();
//                    _this.handleError( err, req, res );
//                    return next();
//                }
//                else if( !charge ){
//                    t.rollback();
//                    res.send( 404, { errors: [ 'No charge found' ] } );
//                    logger.info( 'charge', 'charge not found - using', req.params.charge_id, {
//                        req: req,
//                        model: 'charge',
//                        model_id: charge.id
//                    } );
//                    return next();
//                }
//                else{
//                    if( charge.status === 1 ){
//                        t.rollback();
//                        res.send( 400, { errors: [ 'You can not update a deleted charge, please create another' ] } );
//                        logger.info( 'charge', 'charge was deleted - disallowing update - charge_id: ', req.params.charge_id, {
//                            req: req,
//                            model: 'charge',
//                            model_id: charge.id
//                        } );
//                        return next();
//                    }
//                    if( req.body.charge.start_date !== charge.start_date && ( charge.fee_counter > 0 ) ){
//                        t.rollback();
//                        res.send( 406, { errors: [ 'You may not update the charge start date if a charge transaction has already been processed', ' - please remove charge and create new charge instead' ] } );
//                        logger.info( 'charge', 'Charge can not be modified with new start date because transaction has already been processed - charge counter is greater than zero - charge id: ', charge.id, {
//                            req: req,
//                            model: 'charge',
//                            model_id: charge.id
//                        } );
//                        return next();
//                    }
//                    if( req.body.charge.account_id !== charge.account_id ){
//                        t.rollback();
//                        res.send( 400, { errors: [ 'You may not change the account or currency - please cancel this charge and build a new one' ] } );
//                        logger.info( 'charge', 'Charge can not have currency or account changing - charge id: ', charge.id, {
//                            req: req,
//                            model: 'charge',
//                            model_id: charge.id
//                        } );
//                        return next();
//                    }
//                    if( req.body.charge.type !== charge.type ){
//                        t.rollback();
//                        res.send( 400, { errors: [ 'You may not change the type of charge this is - you must cancel this one and build a new one' ] } );
//                        logger.info( 'charge', 'Charge can not have charge type changing - charge id: ', charge.id, {
//                            req: req,
//                            model: 'charge',
//                            model_id: charge.id
//                        } );
//                        return next();
//                    }
//                    else{
//                        if( charge.start_date !== req.body.charge.start_date ){
//                            if( charge.type === 1 ){
//                                function freqTypeCalc( freqType ){
//                                    var dateType;
//                                    switch( freqType ){
//                                        case 0:
//                                            dateType = 'day';
//                                            break;
//                                        case 1:
//                                            dateType = 'week';
//                                            break;
//                                        case 2:
//                                            dateType = 'month';
//                                            break;
//                                        case 3:
//                                            dateType = 'year';
//                                            break;
//                                    }
//                                    return dateType;
//                                }
//
//                                var calculatedNextDate = moment( req.body.charge.start_date )
//                                    .add( req.body.charge.frequency, freqTypeCalc( req.body.charge.frequency_type ) )
//                                    .utc()
//                                    .format()
//                                    .split( 'T' )[ 0 ];
//
//                                charge.amount = req.body.charge.amount;
//                                charge.start_date = req.body.charge.start_date;
//                                charge.title = req.body.charge.title;
//                                charge.frequency = req.body.charge.frequency;
//                                charge.frequency_type = req.body.charge.frequency_type;
//                                charge.next_payment_date = calculatedNextDate;
//                                charge.notes = req.body.charge.notes;
//
//                                charge.save( { transaction: t } ).done( function( err, savedCharge ){
//                                    if( !!err ){
//                                        t.rollback();
//                                        _this.handleError( err, req, res );
//                                        return next();
//                                    }
//                                    else{
//                                        t.commit();
//                                        res.send( 200, { charge: savedCharge } );
//                                        logger.info( 'charge', 'Charge ID: - [' + savedCharge.id + '] for company_id' + savedCharge.company_id, ' - has been updated', {
//                                            req: req,
//                                            model: 'charge',
//                                            model_id: charge.id
//                                        } );
//                                        return next();
//                                    }
//                                } );
//
//                            }
//                            else{
//                                charge.amount = req.body.charge.amount;
//                                charge.start_date = req.body.charge.start_date;
//                                charge.title = req.body.charge.title;
//                                charge.frequency = req.body.charge.frequency;
//                                charge.frequency_type = req.body.charge.frequency_type;
//                                charge.next_payment_date = req.body.charge.start_date;
//                                charge.notes = req.body.charge.notes;
//
//                                charge.save( { transaction: t } ).done( function( err, savedCharge ){
//                                    if( !!err ){
//                                        t.rollback();
//                                        _this.handleError( err, req, res );
//                                        return next();
//                                    }
//                                    else{
//                                        t.commit();
//                                        res.send( 200, { charge: savedCharge } );
//                                        logger.info( 'charge', 'Charge ID: - [' + savedCharge.id + '] for company_id' + savedCharge.company_id, ' - has been updated', {
//                                            req: req,
//                                            model: 'charge',
//                                            model_id: charge.id
//                                        } );
//                                        return next();
//                                    }
//                                } );
//                            }
//                        }
//                        else{
//                            charge.amount = req.body.charge.amount;
//                            charge.title = req.body.charge.title;
//                            charge.frequency = req.body.charge.frequency;
//                            charge.frequency_type = req.body.charge.frequency_type;
//                            charge.notes = req.body.charge.notes;
//
//                            charge.save( { transaction: t } ).done( function( err, savedCharge ){
//                                if( !!err ){
//                                    t.rollback();
//                                    _this.handleError( err, req, res );
//                                    return next();
//                                }
//                                else{
//                                    t.commit();
//                                    res.send( 200, { charge: savedCharge } );
//                                    logger.info( 'charge', 'Charge ID: - [' + savedCharge.id + '] for company_id' + savedCharge.company_id, ' - has been updated', {
//                                        req: req,
//                                        model: 'charge',
//                                        model_id: charge.id
//                                    } );
//                                    return next();
//                                }
//                            } );
//                        }
//                    }
//
//                }
//
//            } );
//
//        } );
//    }
//    else{
//        util.handleValidationErrors( req, res );
//        return next();
//    }
//};



exports.delete = function( req, res, next ){
    req.assert( 'charge_id', 'isString' );
    if( _.isEmpty( req.validationErrors ) ){
        Charge.find( {
            where: {
                id: req.params.charge_id
            }
        } )
            .done( function( err, charge ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !charge ){
                    res.send( 404, { errors: [ 'Charge cannot be found' ] } );
                    return next();
                }
                else if( charge.status === 2 ){
                    res.send( 400, { errors: [ 'Invalid charge' ] } );
                    return next();
                }
                else{
                    charge.status = 2;
                    charge.save().done( function( err, savedCharge ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else{
                            res.send( 200, { charge: charge } );
                            logger.info( 'charge', 'Charge Canceled [' + savedCharge.id + '][' + charge.company_id + ']', {
                                req: req,
                                model: 'charge',
                                model_id: charge.id
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
