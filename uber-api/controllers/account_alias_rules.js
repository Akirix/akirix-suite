var HttpError = require( "http-error" );
var db = require( '../models' );
var AccountAlias = db.AccountAlias;
var AccountAliasRule = db.AccountAliasRule;
var WireInstruction = db.WireInstruction;
var Account = db.Account;
var Company = db.Company;
var _ = require( 'lodash' );
var util = require( '../lib/akx.util.js' );
var logger = require( '../lib/akx.logger.js' );
var _this = this;
var max_retry = require( '../config/config.json' ).account_alias.max_retry;

exports.handleError = function( err, req, res ){
    util.handleError( 'aliasAccountRule', err, req, res );
};

exports.create = function( req, res, next ){
    req.assert( 'accountAliasRule', 'isObject' );
    req.assert( 'accountAliasRule.prefix', 'isString' );
    req.assert( 'accountAliasRule.total_length', 'isNumber' );

    if( req.body.accountAliasRule.range_min ){
        if( _.isNaN( Number( req.body.accountAliasRule.range_min ) ) ){
            res.send( 400, { errors: [ 'range_min must be number' ] } );
            return next();
        }

        if( req.body.accountAliasRule.range_min.indexOf( req.body.accountAliasRule.prefix ) !== 0 ){
            res.send( 400, { errors: [ 'range_min must start with the same prefix' ] } );
            return next();
        }

        if( req.body.accountAliasRule.range_min.length !== req.body.accountAliasRule.total_length ){
            res.send( 400, { errors: [ 'range_min have the specified length' ] } );
            return next();
        }
    }

    if( req.body.accountAliasRule.range_max ){
        if( _.isNaN( Number( req.body.accountAliasRule.range_max ) ) ){
            res.send( 400, { errors: [ 'range_max must be number' ] } );
            return next();
        }

        if( req.body.accountAliasRule.range_max.indexOf( req.body.accountAliasRule.prefix ) !== 0 ){
            res.send( 400, { errors: [ 'range_max must start with the same prefix' ] } );
            return next();
        }

        if( req.body.accountAliasRule.range_max.length !== req.body.accountAliasRule.total_length ){
            res.send( 400, { errors: [ 'range_max have the specified length' ] } );
            return next();
        }
    }

    if( req.body.accountAliasRule.range_min && req.body.accountAliasRule.range_max && Number( req.body.accountAliasRule.range_max ) < Number( req.body.accountAliasRule.range_min ) ){
        res.send( 400, { errors: [ 'range_min must be smaller than range_max' ] } );
        return next();
    }

    if( req.body.accountAliasRule.prefix.length >= req.body.accountAliasRule.total_length ){
        res.send( 400, { errors: [ 'Total length must be greater than length of prefix' ] } );
        return next();
    }

    var companyId = req.body.accountAliasRule.company_id ? req.body.accountAliasRule.company_id : null;
    Company.find( {
        where: {
            id: companyId
        }
    } ).then( function( company ){
        if( !company && companyId ){
            res.send( 400, { errors: [ 'Invalid company_id' ] } );
            return next();
        }
        else{
        	var wireInstructionId = req.body.accountAliasRule.wire_instruction_id ? req.body.accountAliasRule.wire_instruction_id : null;
        	WireInstruction.find( {
        		where: {
        			id: wireInstructionId
        		}
        	} ).then( function( wireInstruction ){
        		if( !wireInstruction ){
        			res.send( 400, { errors: [ 'Invalid wire_instruction_id' ] } );
                    return next();
        		}
        		else{
        			if( companyId ){  	
		                AccountAliasRule.find( {
		                    where: {
		                        prefix: req.body.accountAliasRule.prefix,
		                        range_min: req.body.accountAliasRule.range_min,
		                        range_max: req.body.accountAliasRule.range_max,
		                        total_length: req.body.accountAliasRule.total_length
		                    }
		                } ).then( function( existingRule ){
		                    if( !existingRule ){
		                        req.body.accountAliasRule.type = 1;
		                        return AccountAliasRule.create( req.body.accountAliasRule ).then( function( rule ){
		                            res.send( 201, { accountAliasRule: rule } );
		                            return next();
		                        } )
		                    }
		                    else{
		                        res.send( 400, { errors: [ 'Generic rule of inputs exists ' ] } );
		                    }
		                } )      	
		            }
		            else{
		                req.body.accountAliasRule.type = 0;
		                return AccountAliasRule.create( req.body.accountAliasRule ).then( function( rule ){
		                    res.send( 201, { accountAliasRule: rule } );
		                    return next();
		                } )
		            }
        		}
            } )
        }
    } ).catch( function( err ){
        _this.handleError( err, req, res );
        return next();
    } )
};

exports.index = function( req, res, next ){
    var query = {
        where: {}
    };
    var paged;

    req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
    req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );
    paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;

    if( paged ){
        query[ 'offset' ] = ( req.params.page - 1 ) * req.params.per_page;
        query[ 'limit' ] = req.params.per_page;
    }

    if( !_.isEmpty( req.params.type ) ){
        query.where[ 'type' ] = req.params.type;
    }

    if( !_.isEmpty( req.params.company_id ) ){
        query.where[ 'company_id' ] = req.params.company_id;
    }

    AccountAliasRule.findAndCountAll( query ).then( function( rules ){
        var totalPages = 1;
        if( paged ){
            var pageRatio = rules.count / req.params.per_page;
            totalPages = Math.floor( pageRatio );
            if( pageRatio % 1 > 0 ){
                totalPages++;
            }
        }
        res.send( 200, { accountAliasRules: rules.rows, meta: { total_pages: totalPages } } );
        return next();
    } ).catch( function( err ){
        _this.handleError( err, req, res );
        return next();
    } );

};


exports.view = function( req, res, next ){

    req.assert( 'account_alias_rule_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        AccountAliasRule.find( {
            where: {
                id: req.params.account_alias_rule_id
            }
        } ).then( function( aliasRule ){
            if( !aliasRule ){
                res.send( 400, { errors: [ 'Account alias rule not found' ] } );
                return next();
            }
            else{
                res.send( 200, { accountAliasRule: aliasRule } );
                return next();
            }
        } ).catch( function( err ){
            _this.handleError( err, req, send );
            return next();
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }

};

exports.delete = function( req, res, next ){

    req.assert( 'account_alias_rule_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        AccountAliasRule.find( {
            where: {
                id: req.params.account_alias_rule_id
            }
        } ).then( function( rule ){
            return rule.destroy()
        } ).then( function( rule ){
            res.send( 200, { accountAliasRule: rule } );
            return next();
        } ).catch( function( err ){
            _this.handleError( err, req, res );
            return next();
        } )
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }

};


exports.genPANClient = function( req, rule, companyAccount ){
    return Account.find( {
        where: {
            id: req.body.client_account_id,
            company_id: req.body.client_company_id
        }
    } ).then( function( clientAccount ){
        if( _.isEmpty( clientAccount ) ){
            throw new HttpError.BadRequest( 'Invalid client_account_id' );
        } else{
            if( companyAccount.currency_id !== clientAccount.currency_id ){
                throw new HttpError.BadRequest( 'Account currencies do not match' );
            } else{
                return rule.generateAccountAlias( req.body.company_id, req.body.account_id, req.body.client_company_id, req.body.client_account_id, req.body.notes, max_retry )
            }
        }
    } );
};

exports.genPANCompany = function( req, rule ){
    return rule.generateAccountAlias( req.body.company_id, req.body.account_id, null, null, req.body.notes, max_retry )
};

exports.generateAccountAlias = function( req, res, next ){

    req.assert( 'account_id', 'isString' );
    req.assert( 'account_alias_rule_id', 'isString' );
    req.assert( 'company_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        var companyAccount, ruleGlobal;

        AccountAliasRule.find( {
            where: {
                id: req.body.account_alias_rule_id
            }
        } )
            .then( function( rule ){
                if( !rule ){
                    throw new HttpError.BadRequest( 'Invalid account_alias_rule_id' );
                }
                else{
                    return rule;
                }
            } )
            .then( function( rule ){
                ruleGlobal = rule;
                return Account.find( {
                    where: {
                        id: req.body.account_id,
                        company_id: req.body.company_id
                    }
                } )
            } )
            .then( function( account ){
                if( !account ){
                    throw new HttpError.BadRequest( 'Invalid account_id' );
                } else{
                    companyAccount = account;
                    if( req.body.client_account_id || req.body.client_company_id ){
                        return _this.genPANClient( req, ruleGlobal, companyAccount );
                    }
                    else{
                        return _this.genPANCompany( req, ruleGlobal );
                    }
                }
            } )
            .then( function( newAccountAlias ){
                res.send( 200, { account_alias: newAccountAlias } );
                return next();
            } )
            .catch( function( err ){
                if( err.code === 400 ){
                    res.send( err.code, { errors: [ err.message ] } )
                }
                else{
                    _this.handleError( err, req, res );
                }
                return next();
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }

};