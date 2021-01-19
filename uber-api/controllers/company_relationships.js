var _ = require( 'lodash' );
var notifier = require( '../lib/akx.notifier.js' );
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

var dbCore = require( '../models' );
var dbInstitution = require( '../models_institution' );
var CompanyRelationship = dbInstitution.CompanyRelationship;
var Company = dbCore.Company;

exports.handleError = function( err, req, res ){
    util.handleError( 'company', err, req, res );
};



exports.index = function( req, res, next ){

    if( _.isEmpty( req.validationErrors ) ){

        var query = {
            where: {},
        };
        req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
        req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );

        var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
        if( paged ){
            query.offset = ( req.params.page - 1 ) * req.params.per_page;
            query.limit = req.params.per_page;
        }

        var validFields = [ 'institution_id', 'status', 'company_id' ];
        _.forEach( validFields, function( field ){
            if( _.has( req.params, field ) ){
                query.where[ field ] = req.params[ field ];
            }
        } );

        CompanyRelationship.findAndCountAll( query ).done( function( err, companyRels ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                var totalPages = 1;
                if( paged ){
                    var pageRatio = companyRels.count / req.params.per_page;
                    totalPages = Math.floor( pageRatio );
                    if( pageRatio % 1 > 0 ){
                        totalPages++;
                    }
                }
                res.send( 200, { company_relationships: companyRels.rows, meta: { total_pages: totalPages } } );
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
    CompanyRelationship.find( {
        where: {
            id: req.params.company_relationship_id
        }
    } )
        .then( function( compRel ){
            if( !compRel ){
                res.send( 404 );
                return next();
            }
            else{
                res.send( 200, { companyRelationship: compRel } );
                return next();
            }
        } )
        .catch( function( err ){
            _this.handleError( err, req, res );
            return next();
        } );
};


exports.add = function( req, res, next ){
    req.assert( 'companyRelationship', 'isObject' );
    req.assert( 'companyRelationship.company_id', 'isString' );
    req.assert( 'companyRelationship.institution_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Company.find( {
            where: {
                id: req.params.companyRelationship.institution_id
            }
        } )
            .then( function( institution ){
                if( !institution ){
                    res.send( 400, {
                        errors: [
                            'Invalid institution_id'
                        ]
                    } );
                    return next();
                }
                else{
                    Company.find( {
                        where: {
                            id: req.params.companyRelationship.company_id
                        }
                    } )
                        .then( function( company ){
                            if( !company ){
                                res.send( 400, {
                                    errors: [
                                        'Invalid company_id'
                                    ]
                                } );
                                return next();
                            }
                            else{
                                CompanyRelationship.find( {
                                    where: {
                                        institution_id: req.params.companyRelationship.institution_id,
                                        company_id: req.params.companyRelationship.company_id,
                                        status: 1
                                    }
                                } )
                                    .then( function( companyRel ){
                                        if( companyRel ){
                                            res.send( 400, {
                                                errors: [
                                                    'Relationship already exist'
                                                ]
                                            } );
                                            return next();
                                        }
                                        else if( req.params.companyRelationship.institution_id === req.params.companyRelationship.company_id ){
                                            res.send( 400, {
                                                errors: [
                                                    'Cannot add self'
                                                ]
                                            } );
                                            return next();
                                        }
                                        else{
                                            CompanyRelationship.create( {
                                                institution_id: req.params.companyRelationship.institution_id,
                                                company_id: req.params.companyRelationship.company_id,
                                                status: 1
                                            } ).then( function( newCompRel ){
                                                res.send( 201, { companyRelationship: newCompRel } );
                                                return next();
                                            } )
                                        }
                                    } )

                            }
                        } );
                }
            } )
            .catch( function( err ){
                _this.handleError( err, req, res );
                return next();
            } );

    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.delete = function( req, res, next ){
    CompanyRelationship.find( {
        where: {
            id: req.params.company_relationship_id
        }
    } )
        .then( function( compRel ){
            if( !compRel ){
                res.send( 404 );
                return next();
            }
            else if( compRel.status === 2 ){
                res.send( 400, {
                    errors: [
                        'Invalid relationship status'
                    ]
                } );
                return next();
            }
            else{
                compRel.status = 2;
                compRel.save()
                    .then( function( compRel ){
                        res.send( 200, { companyRelationship: compRel } );
                        return next();
                    } )
            }
        } )
        .catch( function( err ){
            _this.handleError( err, req, res );
            return next();
        } );
};



