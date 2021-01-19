




var db = require( '../models' );
var _ = require( 'lodash' );

var Company = db.Company;
var User = db.User;

var notifier = require( '../lib/akx.notifier.js' );
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var fs = require( 'fs' );

var _this = this;


exports.handleError = function( err, req, res ){
    util.handleError( 'company', err, req, res );
};







exports.index = function( req, res, next ){
    if( req.params.hasOwnProperty( 'account_number' ) ){
        Company.findAll( {
            where: {
                account_number: req.params.account_number,
                status: [ 1, 2 ]
            }
        } )
            .done( function( err, companies ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{
                    res.send( 200, { companies: companies } );
                    return next();
                }
            } );
    }
    else{
        res.send( 200, { companies: [] } );
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
                    res.send( 404, { errors: [ 'Company not found' ] } );
                    return next();
                }
                else{
                    if( company.values.hasOwnProperty( 'dual_custody' ) ){
                        delete company.values.dual_custody;
                    }
                    company.values.links = {
                        fees: '/fees?company_id=' + company.id
                    };

                    fs.readFile( __dirname + '/../documents/logos/' + req.params.company_id, 'utf8', function( err, data ){
                        if( !!err ){
                            company.values.logo = null;
                            res.send( 200, { company: company } );
                        }
                        else{
                            if( data === "null" || data === null || data === '' ){
                                company.values.logo = "";
                                res.send( 200, { company: company } );
                                return next();
                            }
                            else{
                                company.values.logo = data;
                                res.send( 200, { company: company } );
                                return next();
                            }
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

    req.assert( 'company', 'isObject' );
    req.assert( 'company', 'notEmpty' );

    if( _.isEmpty( req.validationErrors ) ){
        Company.find( {
            where: {
                id: req.user.company_id,
                status: [ 1, 2 ]
            }
        } )
            .done( function( err, company ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !company ){
                    res.send( 404, { errors: [ 'Company not found' ] } );
                    return next();
                }
                else{

                    var validParams = [
                        { key: 'phone', validation: 'isString' },
                        { key: 'fax', validation: 'isString' },
                        { key: 'email', validation: 'isEmail' },
                        { key: 'website', validation: 'isString' },
                        { key: 'address', validation: 'isString' },
                        { key: 'city', validation: 'isString' },
                        { key: 'state_province', validation: 'isString' },
                        { key: 'postal_code', validation: 'isString' },
                        { key: 'country', validation: 'isString' },
                        { key: 'notes', validation: 'isString' }
                    ];

                    _.forEach( validParams, function( value ){
                        if( req.params.company.hasOwnProperty( value.key ) ){

                            // If the property is allowed null and is being set to null don't run the validation
                            if( Company.rawAttributes[ value.key ].allowNull && req.params.company[ value.key ] === null ){
                                company[ value.key ] = null;
                            }
                            else if( req.assert( 'company.' + value.key, value.validation ) === true ){
                                company[ value.key ] = req.params.company[ value.key ];
                            }
                        }
                    } );

                    if( _.isEmpty( req.validationErrors ) ){
                        company.save()
                            .done( function( err ){
                                if( !!err ){
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else{
                                    // Notify the company
                                    User.find( req.user.id )
                                        .done( function( err, user ){
                                            if( !!err ){
                                                logger.error( 'error', 'Failed to find user', {
                                                    req: req
                                                } );
                                            }
                                            else{
                                                notifier.notifyCompany( 'akx-company-update', req.user.company_id, { company_name: company.name, user_name: user.first_name + ' ' + user.last_name }, req );
                                            }
                                        } );

                                    logger.info( 'company', 'company' + company.name + ' [' + company.id + '] updated their profile', {
                                        req: req,
                                        model: 'company',
                                        model_id: company.id
                                    } );

                                    if( company.values.hasOwnProperty( 'dual_custody' ) ){
                                        delete company.values.dual_custody;
                                    }
                                    if( req.params.company.logo === null || req.params.company.logo === '' ){
                                        fs.unlink( __dirname + '/../documents/logos/' + req.params.company_id, function(){
                                            company.values.logo = null;
                                            res.send( 200, { company: company } );
                                            return next();
                                        } );
                                    }
                                    else{
                                        fs.writeFile( __dirname + '/../documents/logos/' + req.params.company_id, req.params.company.logo, 'utf8', function( err, data ){
                                            if( !!err ){
                                                _this.handleError( err, req, res );
                                                return next();
                                            }
                                            else{
                                                company.logo = data;
                                                res.send( 200, { company: company } );
                                                return next();
                                            }
                                        } );
                                    }

                                }
                            } );
                    }
                    else{
                        util.handleValidationErrors( req, res );
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
