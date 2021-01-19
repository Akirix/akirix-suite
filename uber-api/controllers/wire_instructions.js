var _ = require( 'lodash' );
var transports = require( '../config/config.json' ).akxLogger.transports;
var util = require( '../lib/akx.util.js' );
var currentFileName = __filename.split( '/' ).pop();
var akxLogger = require( 'logger' )( currentFileName, transports );
var logger = require( '../lib/akx.logger.js' );

var db = require( '../models' );

var CompanyWireInstruction = db.CompanyWireInstruction;
var AccountAlias = db.AccountAlias;
var WireInstruction = db.WireInstruction;
var Currency = db.Currency;
var Company = db.Company;

var _this = this;

exports.index = function( req, res, next ){
    if( !_.isEmpty( req.params.company_id ) ){
        if( req.params.preferred ){
            _this.preferredWireInstructions( req, res, next );
        }
        else{
            _this.standardWireInstructions( req, res, next );
        }
    }
    else{
        return WireInstruction.findAll( {} ).then( function( wireInstructions ){
            res.send( 200, { wireInstructions: wireInstructions } );
            return next();
        } ).catch( function( err ){
            return util.handleLibError( err, req, res, akxLogger );
        } );
    }
};

exports.view = function( req, res, next ){

    req.assert( 'wire_instruction_id', 'isString' );

    if( req.params.preferred === 'true' ){
        return AccountAlias.find( {
            where: {
                id: req.params.wire_instruction_id,
                status: 1
            },
            include: [
                { model: Company },
                { model: WireInstruction }
            ]
        } ).then( function( accountAlias ){
            if( _.isEmpty( accountAlias ) ){
                return res.send( 404 );
            }
            var wireIns = accountAlias.wireInstruction;
            wireIns.values.id = accountAlias.id;
            wireIns.account_holder = accountAlias.company.name;
            wireIns.account_number = accountAlias.name;
            wireIns.account_iban = accountAlias.iban;
            res.send( 200, { wireInstruction: wireIns } );
            return next();
        } ).catch( function( err ){
            return util.handleLibError( err, req, res, akxLogger );
        } );
    }
    else{
        return WireInstruction.find( {
            where: {
                id: req.params.wire_instruction_id
            }
        } ).then( function( wireInstruction ){
            if( _.isEmpty( wireInstruction ) ){
                return res.send( 404 );
            }
            res.send( 200, { wireInstruction: wireInstruction } );
            return next();
        } ).catch( function( err ){
            return util.handleLibError( err, req, res, akxLogger );
        } );
    }
};

exports.standardWireInstructions = function( req, res, next ){

    CompanyWireInstruction.findAll( {
        where: {
            company_id: req.params.company_id
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
            company_id: req.params.company_id,
            status: 1
        },
        include: [
            { model: Company },
            { model: WireInstruction }
        ]
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
            wireInstruction.account_number = accountAlias.name;
            wireInstruction.account_holder = accountAlias.company.name;
            wireInstruction.account_iban = accountAlias.iban;
            wireInstructions.push( wireInstruction );
            return _this.mapPreferredInstructions(
                accountAliases, wireInstructions
            );
        } );
    }
    else{
        return Promise.resolve( wireInstructions );
    }
};