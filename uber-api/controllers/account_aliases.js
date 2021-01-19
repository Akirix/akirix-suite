var db = require( '../models' );
var AccountAlias = db.AccountAlias;
var Account = db.Account;
var WireInstruction = db.WireInstruction;
var _ = require( 'lodash' );
var util = require( '../lib/akx.util.js' );
var logger = require( '../lib/akx.logger.js' );
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'account', err, req, res );
};



exports.create = function( req, res, next ){

    req.assert( 'accountAlias', 'isObject' );
    req.assert( 'accountAlias.name', 'isString' );
    req.assert( 'accountAlias.account_id', 'isString' );
    req.assert( 'accountAlias.company_id', 'isString' );
    req.assert( 'accountAlias.wire_instruction_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        AccountAlias.find( {
            where: {
                name: req.params.accountAlias.name
            }
        } ).done( function( err, existingAlias ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( existingAlias ){
                res.send( 400, { errors: [ 'Preferred account name already exists' ] } );
                logger.error( 'account', 'Account name already exists', {
                    req: req
                } );
                return next();
            }
            else{
                Account.find( {
                    where: {
                        id: req.params.accountAlias.account_id
                    }
                } ).done( function( err, account ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else if( !account ){
                        res.send( 404, { errors: [ 'No account was found' ] } );
                        logger.error( 'account', 'No account with id of [' + req.params.accountAlias.account_id + '] was found', {
                            req: req
                        } );
                        return next();
                    }
                    else if( account.company_id !== req.params.accountAlias.company_id ){
                        res.send( 400, { errors: [ 'Account company id does not match company id' ] } );
                        logger.error( 'account', 'Company id of account requested does not match company id sent over', {
                            req: req
                        } );
                        return next();
                    }
                    else{
                        WireInstruction.find( {
                            where: {
                                id: req.params.accountAlias.wire_instruction_id
                            }
                        } ).done( function( err, wireIns ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else if( !wireIns ){
                                res.send( 404, { errors: [ 'No wire instruction was found' ] } );
                                return next();
                            }
                            else if( wireIns.currency_id !== account.currency_id ){
                                res.send( 400, { errors: [ 'Account currency and Wire Instruction currency do not match' ] } );
                                return next();
                            }
                            else{
                                AccountAlias.create( {
                                    account_id: account.id,
                                    company_id: account.company_id,
                                    name: req.params.accountAlias.name,
                                    iban: req.params.accountAlias.iban,
                                    wire_instruction_id: req.params.accountAlias.wire_instruction_id,
                                    notes: req.params.accountAlias.notes,
                                    model: req.params.accountAlias.model,
                                    model_id: req.params.accountAlias.model_id,
                                    status: 1
                                } ).done( function( err, newAlias ){
                                    if( !!err ){
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else{
                                        res.send( 201, { accountAlias: newAlias } );
                                        logger.info( 'account', 'New account alias has been created', {
                                            req: req,
                                            model: 'account-alias',
                                            model_id: newAlias.id
                                        } );
                                        return next();
                                    }
                                } );
                            }
                        } );
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



exports.index = function( req, res, next ){
    var query = {
        where: {},
        order: [
            [ 'created_at', 'DESC' ]
        ]
    };
    var paged;

    req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
    req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );
    paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;

    if( paged ){
        query[ 'offset' ] = ( req.params.page - 1 ) * req.params.per_page;
        query[ 'limit' ] = req.params.per_page;
    }

    var validFields = [ 'company_id', 'status', 'account_id', 'name', 'client_company_id', 'client_account_id', 'model', 'model_id', 'wire_instruction_id' ];
    _.forEach( validFields, function( field ){
        if( _.has( req.params, field ) && !_.isEmpty( req.params[ field ] ) ){
            query.where[ field ] = req.params[ field ];
        }
    } );
    
    AccountAlias.findAndCountAll( query ).done( function( err, aliases ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else if( !aliases ){
            res.send( 200, [] );
            return next();
        }
        else{
            var totalPages = 1;
            if( paged ){
                var pageRatio = aliases.count / req.params.per_page;
                totalPages = Math.floor( pageRatio );
                if( pageRatio % 1 > 0 ){
                    totalPages++;
                }
            }
            res.send( 200, { accountAliases: aliases.rows, meta: { total_pages: totalPages } } );
            return next();
        }
    } );

};



exports.view = function( req, res, next ){

    req.assert( 'account_alias_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        AccountAlias.find( {
            where: {
                id: req.params.account_alias_id
            }
        } ).done( function( err, alias ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !alias ){
                res.send( 404, { errors: [ 'Preferred account not found' ] } );
                logger.error( 'account', 'No account alias  found', {
                    req: req
                } );
                return next();
            }
            else{
                res.send( 200, { accountAlias: alias } );
                return next();
            }
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};



exports.deactivate = function( req, res, next ){

    req.assert( 'account_alias_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        AccountAlias.find( {
            where: {
                id: req.params.account_alias_id,
                status: 1
            }
        } ).done( function( err, alias ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !alias ){
                res.send( 404, { errors: [ 'Preferred account must be active before deactivating' ] } );
                logger.error( 'account', 'Account alias must be status 1 before deactivating', {
                    req: req
                } );
                return next();
            }
            else{
                alias.values.status = 0;
                alias.save().done( function( err ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else{
                        res.send( 200, { accountAlias: alias } );
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

exports.search = function( req, res, next ){

    req.assert( 'value', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        var query = {
            where: [],
            order: [
                [ 'created_at', 'DESC' ]
            ]
        };

        req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
        req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );

        var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
        if( paged ){
            query.offset = ( req.params.page - 1 ) * req.params.per_page;
            query.limit = req.params.per_page;
        }

        req.params.value = req.params.value.trim();
        if( !_.isEmpty( req.params.value ) ){
            query.where.push( { name: { like: '%' + req.params.value + '%' } } );
        }

        AccountAlias.findAndCountAll( query ).then( function( account_alias ){

            var totalPages = 1;
            if( paged ){
                var pageRatio = account_alias.count / req.params.per_page;
                totalPages = Math.floor( pageRatio );
                if( pageRatio % 1 > 0 ){
                    totalPages++;
                }
            }
            res.send( 200, { account_alias: account_alias.rows, meta: { total_pages: totalPages } } );
            return next();

        } ).catch( function( err ){
            _this.handle( err, req, res );
            return next();
        } )
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};