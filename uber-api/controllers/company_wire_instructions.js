var _ = require( 'lodash' );
var transports = require( '../config/config.json' ).akxLogger.transports;
var util = require( '../lib/akx.util.js' );
var currentFileName = __filename.split( '/' ).pop();
var akxLogger = require( 'logger' )( currentFileName, transports );
var logger = require( '../lib/akx.logger.js' );

var db = require( '../models' );
var CompanyWireInstruction = db.CompanyWireInstruction;


exports.index = function( req, res, next ){
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

    if( !_.isEmpty( req.params.company_id ) ){
        query.where.company_id = req.params.company_id
    }

    if( !_.isEmpty( req.params.wire_instruction_id ) ){
        query.where.wire_instruction_id = req.params.wire_instruction_id
    }


    return CompanyWireInstruction.findAndCountAll( query ).then( function( companyWireInstructions ){
        var totalPages = 1;
        if( paged ){
            var pageRatio = companyWireInstructions.count / req.params.per_page;
            totalPages = Math.floor( pageRatio );
            if( pageRatio % 1 > 0 ){
                totalPages++;
            }
        }
        res.send( 200, { companyWireInstructions: companyWireInstructions.rows, meta: { total_pages: totalPages } } );
        return next();
    } ).catch( function( err ){
        return util.handleLibError( err, req, res, akxLogger );
    } );
};

exports.add = function( req, res, next ){
    req.assert( 'companyWireInstruction', 'isObject' );
    req.assert( 'companyWireInstruction.wire_instruction_id', 'isString' );
    req.assert( 'companyWireInstruction.company_id', 'isString' );

    return CompanyWireInstruction.find( {
        where: {
            company_id: req.params.companyWireInstruction.company_id,
            wire_instruction_id: req.params.companyWireInstruction.wire_instruction_id
        }
    } ).then( function( companyWireInstruction ){
        if( !_.isEmpty( companyWireInstruction ) ){
            res.send( 400, {
                errors: [
                    'The Wire Instruction already exists.'
                ]
            } );

            return next();
        }

        return CompanyWireInstruction.create( {
            wire_instruction_id: req.params.companyWireInstruction.wire_instruction_id,
            company_id: req.params.companyWireInstruction.company_id
        } ).then( function( comWireInstruction ){
            res.send( 200, { companyWireInstruction: comWireInstruction } );
            return next();
        } );


    } ).catch( function( err ){
        return util.handleLibError( err, req, res, akxLogger );
    } );
};

exports.delete = function( req, res, next ){
    req.assert( 'company_wire_instruction_id', 'isString' );

    return CompanyWireInstruction.find( {
        where: {
           id: req.params.company_wire_instruction_id
        }
    } ).then( function( companyWireInstruction ){
        if( _.isEmpty( companyWireInstruction ) ){
            return res.send( 404 );
        }
        return companyWireInstruction.destroy().then( function( comWireInstruction ){
            res.send( 200, { companyWireInstruction: comWireInstruction } );
            return next();
        } );

    } ).catch( function( err ){
        return util.handleLibError( err, req, res, akxLogger );
    } );
};
