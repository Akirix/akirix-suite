var Sequelize = require( 'sequelize' );
var db = require( '../models' );
var dbInstitution = require( '../models_institution' );
var _ = require( 'lodash' );

var Company = db.Company;
var Token = db.Token;
var User = db.User;
var Account = db.Account;
var InstitutionToken = dbInstitution.Token;

var notifier = require( '../lib/akx.notifier.js' );
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'company', err, req, res );
};

exports.index = function( req, res, next ){
    var query = {
        where: {},
        order: 'account_number DESC'
    };

    var validFields = [ 'account_number', 'affiliate', 'type', 'status', 'country' ];
    _.forEach( validFields, function( field ){
        if( _.has( req.params, field ) && !_.isEmpty( req.params[ field ] ) ){
            query.where[ field ] = req.params[ field ];
        }
    } );

    req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
    req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );

    var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
    if( paged ){
        query.offset = ( req.params.page - 1 ) * req.params.per_page;
        query.limit = req.params.per_page;
    }

    if( query.where.account_number === null ){
        res.send( 200, { companies: [] } );
        return next();
    }
    else{

        Company.findAndCountAll( query )
            .done( function( err, companies ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{


                    var totalPages = 1;
                    if( paged ){
                        var pageRatio = companies.count / req.params.per_page;
                        totalPages = Math.floor( pageRatio );
                        if( pageRatio % 1 > 0 ){
                            totalPages++;
                        }
                    }

                    for( var i = 0; i < companies.rows.length; i++ ){
                        companies.rows[ i ].values.links = {
                            fees: '/fees?company_id=' + companies.rows[ i ].id
                        };
                    }

                    res.send( 200, { companies: companies.rows, meta: { total_pages: totalPages } } );
                    return next();
                }
            } );
    }
};

exports.search = function( req, res, next ){

    req.assert( 'value', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        var query = {
            where: {},
            order: 'account_number DESC'
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
        if( !_.isEmpty( req.params.value ) ){
            queryParams.push( { name: { like: '%' + req.params.value + '%' } } );
            queryParams.push( { account_number: { like: '%' + req.params.value + '%' } } );
        }

        query.where = db.Sequelize.or.apply( _this, queryParams );

        Company.findAndCountAll( query ).done( function( err, companies ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                var totalPages = 1;
                if( paged ){
                    var pageRatio = companies.count / req.params.per_page;
                    totalPages = Math.floor( pageRatio );
                    if( pageRatio % 1 > 0 ){
                        totalPages++;
                    }
                }
                res.send( 200, { companies: companies.rows, meta: { total_pages: totalPages } } );
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

    req.assert( 'company_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Company.find( {
            where: {
                id: req.params.company_id
            }
        } )
            .done( function( err, company ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !company ){
                    res.send( 404 );
                    return next();
                }
                else{
                    company.values.links = {
                        fees: '/fees?company_id=' + company.id
                    };
                    res.send( 200, { company: company } );
                    return next();
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};





exports.update = function( req, res, next ){

    req.assert( 'company_id', 'isString' );
    req.assert( 'company', 'isObject' );
    req.assert( 'company.name', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Company.find( {
            where: {
                id: req.params.company_id
            }
        } ).done( function( err, company ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next()
            }
            else if( !company ){
                res.send( 404 );
                return next();
            }
            else{
                var validParamsArray = [
                    { key: 'name', validation: 'isString' },
                    { key: 'phone', validation: 'isString' },
                    { key: 'fax', validation: 'isString' },
                    { key: 'email', validation: 'isEmail' },
                    { key: 'website', validation: 'isString' },
                    { key: 'address', validation: 'isString' },
                    { key: 'city', validation: 'isString' },
                    { key: 'state_province', validation: 'isString' },
                    { key: 'postal_code', validation: 'isString' },
                    { key: 'country', validation: 'isString' },
                    { key: 'status', validation: 'isNumber' },
                    { key: 'notes', validation: 'isString' },
                    { key: 'affiliate', validation: 'isNumber' }
                ];
                _.forEach( validParamsArray, function( vParam ){
                    if( req.params.company.hasOwnProperty( vParam.key ) ){
                        // If the property is allowed null and is being set to null don't run the validation
                        if( Company.rawAttributes[ vParam.key ].allowNull && req.params.company[ vParam.key ] === null ){
                            company.values[ vParam.key ] = null
                        }
                        else if( req.assert( 'company.' + vParam.key, vParam.validation ) === true ){
                            company.values[ vParam.key ] = req.params.company[ vParam.key ];
                        }
                    }
                } );
                if( _.isEmpty( req.validationErrors ) ){
                    return company.save().done( function( err, company ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else if( company.status !== 1 ){
                            return Token.destroy( { company_id: company.id } ).then( function(){
                                return InstitutionToken.destroy( { company_id: company.id } );
                            } ).then( function(){
                                logger.info( 'company', company.name + '[' + company.id + '] was updated', {
                                    req: req
                                } );
                                res.send( 200, { company: company } );
                                return next();
                            } ).catch( function( err ){
                                _this.handleError( err, req, res );
                                return next();
                            } );
                        }
                        else{
                            logger.info( 'company', company.name + '[' + company.id + '] was updated', {
                                req: req
                            } );
                            res.send( 200, { company: company } );
                            return next();
                        }
                    } )
                }
            }
        } )
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};




exports.activate = function( req, res, next ){
    return Company.find( {
        where: {
            id: req.params.company_id
        }
    } ).then( function( company ){
            if( !_.isEmpty( company ) && company.status === 2 ){
                company.status = 1;
                return company.save().then( function( company ){
                    logger.info( 'company', company.name + '[' + company.id + '] was activated', {
                        req: req
                    } );
                    res.send( 200, { company: company } );
                    return next();
                } );
            }
            else{
                res.send( 400, { errors: [ "Invalid company status." ] } );
                return next();
            }
        }
    ).catch( function( err ){
        _this.handleError( err, req, res );
        return next();
    } );


};



exports.close = function( req, res, next ){
    return Company.find( {
        where: {
            id: req.params.company_id
        }
    } ).then( function( company ){
            if( !_.isEmpty( company ) && company.status !== 0 ){
                return Account.count( {
                    where: [
                        { company_id: company.id },
                        Sequelize.or(
                            { balance: { ne: 0 } },
                            { balance_hold: { ne: 0 } }
                        )
                    ]
                } ).then( function( accountsNumber ){
                    if( accountsNumber ){
                        res.send( 400, { errors: [ "Cannot close company because there is remaining balance." ] } );
                        return next();
                    }
                    company.status = 0;
                    return company.save().then( function( company ){
                        return Token.destroy( { company_id: company.id } ).then( function(){
                            return InstitutionToken.destroy( { company_id: company.id } );
                        } );
                    } ).then( function(){
                        logger.info( 'company', company.name + '[' + company.id + '] was closed', {
                            req: req
                        } );
                        res.send( 200, { company: company } );
                        return next();
                    } );

                } );
            }
            else{
                res.send( 400, { errors: [ "Invalid company status." ] } );
                return next();
            }
        }
    ).catch( function( err ){
        _this.handleError( err, req, res );
        return next();
    } );
};



exports.suspend = function( req, res, next ){
    req.assert( 'company_id', 'isString' );

    return Company.find( {
        where: {
            id: req.params.company_id
        }
    } ).then( function( company ){
            if( !_.isEmpty( company ) && company.status === 1 ){
                company.status = 2;
                return company.save().then( function( company ){
                    return Token.destroy( { company_id: company.id } );
                } ).then( function(){
                    return InstitutionToken.destroy( { company_id: company.id } );
                } ).then( function(){
                    logger.info( 'company', company.name + '[' + company.id + '] was suspended', {
                        req: req
                    } );
                    res.send( 200, { company: company } );
                    return next();
                } );
            }
            else{
                res.send( 400, { errors: [ "Invalid company status." ] } );
                return next();
            }
        }
    ).catch( function( err ){
        _this.handleError( err, req, res );
        return next();
    } );

};


exports.generateAccountNumber = function( req, res, next ){
    var activeNum;
    db.sequelize.query( 'SELECT account_number FROM companies' )
        .done( function( err, accountNums ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{
                    var start = Number( req.params.start );
                    var end = Number( req.params.end );
                    activeNum = Math.floor( Math.random() * ( end - start ) ) + start;
                    activeNum = ( '0000' + activeNum.toString() ).slice( -5 );
                    while( _.findIndex( accountNums, { 'account_number': activeNum } ) !== -1 ){
                        activeNum = Math.floor( Math.random() * ( end - start ) ) + start;
                        activeNum = ( '0' + activeNum.toString() ).slice( -5 );
                    }
                    res.send( 200, { account_number: activeNum } );
                    return next();

                }
            }
        );
};

//exports.affiliateStatus = function(req, res, next){
//    req.assert( 'company_id', 'isString' );
//    if( _.isEmpty( req.validationErrors ) ){
//        Company.find( {
//            where: {
//                id: req.params.company_id
//            }
//        } ).done( function( err, company ){
//            if( !!err ){
//                _this.handleError( err, req, res );
//                return next()
//            }
//            else if( !company ){
//                res.send( 404 );
//                return next();
//            }
//            else{
//                var validParamsArray = [
//                    { key: 'name', validation: 'isString' },
//                    { key: 'phone', validation: 'isString' },
//                    { key: 'fax', validation: 'isString' },
//                    { key: 'email', validation: 'isEmail' },
//                    { key: 'website', validation: 'isString' },
//                    { key: 'address', validation: 'isString' },
//                    { key: 'city', validation: 'isString' },
//                    { key: 'state_province', validation: 'isString' },
//                    { key: 'postal_code', validation: 'isString' },
//                    { key: 'country', validation: 'isString' },
//                    { key: 'notes', validation: 'isString' }
//                ];
//                _.forEach( validParamsArray, function( vParam ){
//                    if( req.params.company.hasOwnProperty( vParam.key ) ){
//
//                        // If the property is allowed null and is being set to null don't run the validation
//                        if( Company.rawAttributes[ vParam.key ].allowNull && req.params.company[ vParam.key ] === null ){
//                            company.values[ vParam.key ] = null;
//                        }
//                        else if( req.assert( 'company.' + vParam.key, vParam.validation ) === true ){
//                            company.values[ vParam.key ] = req.params.company[ vParam.key ];
//                        }
//                    }
//                } );
//                if( _.isEmpty( req.validationErrors ) ){
//                    company.save().done( function( err ){
//                        if( !!err ){
//                            _this.handleError( err, req, res );
//                            return next();
//                        }
//                        else{
//                            logger.info( 'company', company.name + '[' + company.id + '] was updated', {
//                                req: req
//                            } );
//                            res.send( 200, { company: company } )
//                        }
//                    } )
//                }
//            }
//        } )
//    }
//};
//
