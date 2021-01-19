var request = require( 'request' );
var Promise = require( 'promise' );
var Sequelize = require( 'sequelize' );
var logger = require( '../lib/aml.logger.js' );
var util = require( '../lib/aml.util.js' );
var config = require( '../config/config.json' );
var elasticsearch = require( 'elasticsearch' );
var client = new elasticsearch.Client( {
    host: config.elasticsearch.host,
    apiVersion: '1.5',
    log: 'info'
} );
var _ = require( 'lodash' );
var db = require( '../models' );
var Alias = db.Alias;
var _this = this;
var mainIndex = 'sanctions';



exports.handleError = function( err, req, res ){
    util.handleError( 'search', err, req, res );
};

/**
 * @api {post} /search Search search
 * @apiName SearchSearch
 * @apiVersion 1.0.0
 * @apiGroup Search
 * @apiDescription Searches the Sanctions database based on the name, location, and identification
 *
 * @apiParam {Object} data The data object.
 * @apiParam {String} data.name The name of individual or entity.
 * @apiParam (String} [data.location] Any known locations of individual or entity.
 * @apiParam {String} [data.identification] Any known identifications of individual or entity.
 *
 * @apiSuccess {Object[]} hits The hits data that elasticsearch matched to names and other parameters.
 * @apiSuccess {string} hits.index The index individual or entity was found.
 * @apiSuccess {string} hits.type The sanction list from which the individual or entity was found.
 * @apiSuccess {Object} hits.data All the information of individual or entity.
 *
 * @apiSucessExample {Json} Success-Response:
 *  HTTP/1.1 200 OK
 *      {
 *          hits:[
*                  {
*                    "index": "sanctions",
*                    "type": "au-dfat",
*                    "data": {
*                      "Reference": "2486",
*                      "Name of Individual or Entity": "Robert Gabriel MUGABE",
*                      "Type": "Individual",
*                      "Name Type": "Primary Name",
*                      "Date of Birth": "2/21/24",
*                      "Place of Birth": "",
*                      "Citizenship": "",
*                      "Address": "",
*                      "Additional Information": "President",
*                      "Listing Information": "Designated under the Autonomous Sanctions Regulations 2011 on 2 March 2012. Formerly listed on the RBA Consolidated List as 2002ZIM0113",
*                      "Committees": "Autonomous (Zimbabwe)",
*                      "Control Date": "3/2/12"
*                  }
 *          ]
 *      }
 *
 * @apiError (500) {Object[]} errors The errors object.
 * @apiError {String} errors[0] An internal error has occurred.
 *
 * @apiErrorExample (JSON} Error-Response:
 *  HTTP/1.1 500 Internal Server Error
 *      {
 *          errors: [ 'An internal error has occurred' ]
 *      }
 */

/**
 * Searches elasticsearch with a name, location, and identification
 * @param req
 * @param res
 * @param next
 */

exports.search = function( req, res, next ){

    req.assert( 'data', 'isObject' );
    req.assert( 'data.name', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        var promises = [];
        _.forEach( _sanitize( req ), function( name ){
            promises.push( _findNickName( name ) );
        } );
        Promise.all( promises )
            .then( function( results ){
                var nameVariants = [];
                if( results.length > 1 ){
                    _getCombos( [], results, nameVariants );
                }
                else{
                    nameVariants.push( results[ 0 ] );
                }

                promises = [];
                _.forEach( nameVariants, function( variant ){
                    var query = { size: 100, query: { filtered: { filter: {} } } };

                    query.query.filtered[ 'query' ] = { match: { name: { query: variant, "operator": "and" } } };

                    if( req.params.data.hasOwnProperty( 'location' ) ){

                        query.query.filtered.filter[ 'bool' ] = { must: { match: { location: req.params.data.location } } };
                    }

                    promises.push( _queryES( query ) );
                } );

                if( req.params.data.hasOwnProperty( 'identification' ) ){
                    _.forEach( req.params.data.identification.split( ',' ), function( id ){

                        var query = { size: 100, query: { match: { identification: id } } };

                        promises.push( _queryES( query ) );
                    } );
                }

                Promise.all( promises )
                    .then( function( outputArr ){
                        var hitsData = {};
                        _.forEach( outputArr, function( hits ){
                            if( hits.length > 0 ){
                                _.forEach( hits, function( hit ){
                                    if( !hitsData[ hit._type + hit._id ] ){
                                        hitsData[ hit._type + hit._id ] = {
                                            'index': hit[ "_index" ],
                                            'type': hit[ "_type" ],
                                            'data': hit[ "_source" ][ "data" ]
                                        }
                                    }
                                } );

                            }
                        } );
                        var results = [];
                        for( var property in hitsData ){
                            results.push( hitsData[ property ] );
                        }
                        res.send( 200, { hits: results } );
                        return next();
                    } );
            } )
            .catch( function( err ){
                this.handleError( err, req, res );
                return next();
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

/**
 * Helper function to sanitize req names
 * @param req
 */

function _sanitize( req ){
    var regExRemove = /(\.|,|;|'|"|\(|\))/g;
    var regExSpace = /(-|–|\/)/g;
    var cleanArr = req.params.data.name.replace( regExSpace, ' ' ).replace( regExRemove, '' ).toLowerCase().split( ' ' );
    //console.log( cleanArr );
    var dirtyWords = [ '', '.', '&', 'mr', 'mrs', 'dr', 'sr', 'jr', 'llc', 'inc', 'ltd', 'co', 'zoo', 'gmbh', 'sarl', 'sa', 'sas', 'fzc', 'fze', 'limited', 'corp', 'sro', 'pty', 'sp', 'de', 'ffc', 'the', 'of', 'for', 'el', 'al', 'bank', 'trust', 'company', 'and', 'import', 'export', 'trading', 'group', 'holding', 'international', 'intl', 'foundation' ];

    for( var i = 0; i < dirtyWords.length; i++ ){
        var word = dirtyWords[ i ];
        var idx = _.indexOf( cleanArr, word );

        if( idx !== -1 ){
            cleanArr.splice( idx, 1 );
            i--;
        }
    }

    return cleanArr;
}

/**
 * Helper function that queries the mysql names database for nick_names.
 * @param name
 */

function _findNickName( name ){
    return new Promise( function( resolve, reject ){
        Alias.findAll( {
            where: {
                name: name
            }
        } ).then( function( aliases ){
            var results = [];
            results.push( name );
            _.forEach( aliases, function( alias ){
                results.push( alias.alias );
            } );
            resolve( results );
        } );
    } );
}

/**
 * Helper function that queries the elastic search database.
 * @param query
 */

function _queryES( query ){
    return new Promise( function( resolve, reject ){
        client
            .search( {
                index: mainIndex,
                body: query
            } )
            .then( function( resp ){
                resolve( resp.hits.hits );
            } )
            .catch( function( err ){
                reject( err );
            } );
    } );
}

/**
 * recursive functions that get all name variations.
 * @param prevPart
 * @param nameVariants
 * @param outputArr
 */

function _getVariants( prevPart, nameVariants, outputArr ){
    if( nameVariants.length === 0 ){
        outputArr.push( prevPart.trim() );
    }
    _.forEach( nameVariants[ 0 ], function( name ){
        _getVariants( prevPart + ' ' + name, nameVariants.slice( 1 ), outputArr );
    } );
}

function _getCombos( prevPart, combos, outputArr ){
    if( prevPart.length > 1 ){
        _getVariants( '', prevPart, outputArr );
    }

    for( var i = 0; i < combos.length; i++ ){
        var partAfter = combos.slice( i + 1 );
        var newPrev = prevPart.slice();
        newPrev.push( combos[ i ] );
        _getCombos( newPrev, partAfter, outputArr );
    }
}