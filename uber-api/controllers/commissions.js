


var Sequelize = require( 'sequelize' );
var _ = require( 'lodash' );
var db = require( '../models' );
var Commission = db.Commission;
var Company = db.Company;

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;



exports.handleError = function( err, req, res ){
    util.handleError( 'commission', err, req, res );
};




exports.index = function( req, res, next ){

    if( _.isEmpty( req.validationErrors ) ){

        var query = {
            where: {}
        };
        req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
        req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );

        var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
        if( paged ){
            query.offset = ( req.params.page - 1 ) * req.params.per_page;
            query.limit = req.params.per_page;
        }

        var validFields = [ 'status', 'affiliate_id' ];
        _.forEach( validFields, function( field ){
            if( _.has( req.params, field ) ){
                query.where[ field ] = req.params[ field ];
            }
        } );

        Commission.findAndCountAll( query ).done( function( err, commissions ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !commissions ){
                res.send( 404 );
                return next();
            }
            else{
                var totalPages = 1;
                if( paged ){
                    var pageRatio = commissions.count / req.params.per_page;
                    totalPages = Math.floor( pageRatio );
                    if( pageRatio % 1 > 0 ){
                        totalPages++;
                    }
                }
                res.send( 200, { commissions: commissions.rows, meta: { total_pages: totalPages } } );
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
    req.assert( 'commission_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        var query = {
            where: [ {
                id: req.params.commission_id
            } ]
        };
        Commission.find( query ).done( function( err, item ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !item ){
                res.send( 404 );
                return next();
            }
            else{
                item.values.links = {
                    commission_payment_items: '/commissionPaymentItems?commission_id=' + item.id
                };
                res.send( 200, { commission: item } );
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
    req.assert( 'commission', 'isObject' );
    req.assert( 'commission.company_id', 'isString' );
    req.assert( 'commission.affiliate_id', 'isString' );
    req.assert( 'commission.rate', 'isNumber' );
    req.assert( 'commission.start_date', 'isDate' );
    req.assert( 'commission.end_date', 'isDate' );

    if( _.isEmpty( req.validationErrors ) ){

        var chainer = new Sequelize.Utils.QueryChainer;
        chainer.add(
            Commission.find( {
                where: {
                    affiliate_id: req.body.commission.affiliate_id,
                    company_id: req.body.commission.company_id
                }
            } )
        );
        chainer.add(
            Company.find( {
                where: {
                    id: req.body.commission.affiliate_id
                }
            } )
        );
        chainer.add(
            Company.find( {
                where: {
                    id: req.body.commission.company_id
                }
            } )
        );
        chainer.runSerially().done( function( err, results ){
            var commissionExists = results[ 0 ];
            var affCompany = results[ 1 ];
            var comCompany = results[ 2 ];

            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( commissionExists ){
                res.send( 400, { errors: [ 'Commission already exists' ] } );
                logger.error( 'commission', 'Commission with id of [' + commissionExists.id + '] already exists', {
                    req: req
                } );
                return next();
            }
            else if( !comCompany ){
                res.send( 400, { errors: [ 'Invalid company_id' ] } );
                logger.error( 'commission', 'No company found with id of [' + req.body.commission.company_id + ']', {
                    req: req
                } );
                return next();
            }
            else if( !affCompany ){
                res.send( 400, { errors: [ 'Invalid affiliate_id' ] } );
                logger.error( 'commission', 'Invalid affiliate id [' + req.body.commission.affiliate_id + ']', {
                    req: req
                } );
                return next();
            }
            else if( comCompany.id === affCompany.id ){
                res.send( 400, { errors: [ 'Invalid company_id' ] } );
                logger.error( 'commission', 'Invalid company id [' + req.body.commission.company_id + ']', {
                    req: req
                } );
                return next();
            }
            else{
                Commission.build( {
                    affiliate_id: req.body.commission.affiliate_id,
                    company_id: req.body.commission.company_id,
                    status: 1,
                    rate: Number( req.body.commission.rate ),
                    start_date: req.body.commission.start_date,
                    end_date: req.body.commission.end_date
                } ).save().done( function( err, commission ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else{
                        res.send( 201, { commission: commission } );
                        logger.info( 'commission', 'Commission created for company [' + commission.company_id + ']', {
                            req: req,
                            model: 'commission',
                            model_id: commission.id
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






exports.update = function( req, res, next ){
    req.assert( 'commission_id', 'isString' );
    req.assert( 'commission', 'isObject' );
    req.assert( 'commission.rate', 'isNumber' );
    req.assert( 'commission.status', 'isNumber' );
    req.assert( 'commission.start_date', 'isDate' );
    req.assert( 'commission.end_date', 'isDate' );

    if( _.isEmpty( req.validationErrors ) ){

        Commission.find( {
            where: {
                id: req.params.commission_id
            }
        } ).done( function( err, commission ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                commission.rate = req.params.commission.rate;
                commission.status = req.params.commission.status;
                commission.start_date = req.params.commission.start_date;
                commission.end_date = req.params.commission.end_date;
                commission.save().done( function( err ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else{
                        res.send( 200, { commission: commission } );
                        logger.info( 'commission', 'Commission has updated', {
                            req: req,
                            model: 'commission',
                            model_id: commission.id,
                            previousValues: commission.selectedValues
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
