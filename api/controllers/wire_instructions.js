var _ = require( 'lodash' );
var transports = require( '../config/config.json' ).akxLogger.transports;
var util = require( '../lib/akx.util.js' );
var currentFileName = __filename.split( '/' ).pop();
var akxLogger = require( 'logger' )( currentFileName, transports );

var db = require( '../models' );
var CompanyWireInstruction = db.CompanyWireInstruction;
var AccountAlias = db.AccountAlias;
var WireInstruction = db.WireInstruction;
var Currency = db.Currency;
var Company = db.Company;

var _this = this;


exports.index = function( req, res, next ){

    if( req.params.preferred ){
        _this.preferredWireInstructions( req, res, next );
    }
    else if( !_.isEmpty( req.params.model ) ){
        switch( req.params.model ){
            case 'node':
                _this.smartProjectWireInstructions( req, res, next );
                break;
            default:
                res.send( 404 );
                return next();
        }
    }
    else{
        _this.standardWireInstructions( req, res, next );
    }
};


exports.standardWireInstructions = function( req, res, next ){

    CompanyWireInstruction.findAll( {
        where: {
            company_id: req.user.company_id
        }
    } ).then( function( comWireIns ){
        var instructionIds = [];
        _.forEach( comWireIns, function( comIns ){
            instructionIds.push( comIns.wire_instruction_id );
        } );
        return instructionIds;
    } ).then( function( instructionIds ){
        if( instructionIds.length === 0 ){
            res.send( 200, { wireInstructions: [] } );
            return next();
        }
        else{
            return WireInstruction.findAll( {
                where: {
                    id: instructionIds
                }
            } ).then( function( wireInstructions ){
                res.send( 200, { wireInstructions: wireInstructions } );
                return next();
            } );
        }
    } ).catch( function( err ){
        return util.handleLibError( err, req, res, akxLogger );
    } );
};


exports.preferredWireInstructions = function( req, res, next ){

    AccountAlias.findAll( {
        where: {
            company_id: req.user.company_id,
            model: null,
            model_id: null,
            status: 1
        },
        include: {
            model: Company
        }
    } ).then( function( accountAliases ){
        if( accountAliases.length === 0 ){
            res.send( 200, { wireInstructions: [] } );
            return next();
        }
        else{
            _this.mapPreferredInstructions( accountAliases, [] ).then( function( wireInstructions ){
                res.send( 200, { wireInstructions: wireInstructions } );
                return next();
            } );
        }
    } ).catch( function( err ){
        return util.handleLibError( err, req, res, akxLogger );
    } );
};


exports.mapPreferredInstructions = function( accountAliases, wireInstructions ){
    if( accountAliases.length > 0 ){
        var accountAlias = accountAliases.pop();
        return WireInstruction.find( {
            where: {
                id: accountAlias.wire_instruction_id
            },
            include: {
                model: Currency
            }
        } ).then( function( wireInstruction ){
            wireInstruction.values.id = accountAlias.id;
            wireInstruction.account_holder = accountAlias.company.name;
            wireInstruction.account_number = accountAlias.name;
            wireInstruction.account_iban = accountAlias.iban;
            wireInstruction.dataValues.account_id = accountAlias.account_id;
            wireInstructions.push( wireInstruction );
            return _this.mapPreferredInstructions( accountAliases, wireInstructions );
        } );
    }
    else{
        return Promise.resolve( wireInstructions );
    }
};


exports.smartProjectWireInstructions = function( req, res, next ){
    AccountAlias.findAll( {
        where: {
            company_id: req.user.company_id,
            model: 'node',
            model_id: req.params.model_id,
            status: 1
        },
        include: {
            model: Company
        }
    } ).then( function( accountAliases ){
        if( accountAliases.length === 0 ){
            res.send( 200, { wireInstructions: [] } );
            return next();
        }
        else{
            _this.mapPreferredInstructions( accountAliases, [] ).then( function( wireInstructions ){
                res.send( 200, { wireInstructions: wireInstructions } );
                return next();
            } );
        }
    } ).catch( function( err ){
        return util.handleLibError( err, req, res, akxLogger );
    } );
};