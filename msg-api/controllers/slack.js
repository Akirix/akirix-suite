

var _ = require( 'lodash' );
var fs = require( 'fs' );
var moment = require( 'moment-timezone' );
var Handlebars = require( 'handlebars' );
var Promise = require( 'bluebird' );
var request = require( 'request' );
var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities();

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );

const templatePath = __dirname + '/../templates_text';
var _this = this;

require( '../lib/akx.handlebars.js' )();

exports.handleError = function( err, req, res ){
    util.handleError( 'email', err, req, res );
};


exports._getTemplate = function( template_name, data ){
    return new Promise( function( resolve, reject ){
        fs.readFile( templatePath + '/' + template_name + '.hbs', 'utf8', function( err, templateData ){
            if( err ){
                reject( err );
            }
            else if( _.isEmpty( templateData ) ){
                reject( new Error( 'Template is empty' ) );
            }
            else{
                try{
                    var template = Handlebars.compile( templateData );
                    var compiledTemplate = template( data );
                    resolve( { template: compiledTemplate } );
                }
                catch( err ){
                    reject( err );
                }
            }
        } );
    } );
};






exports.create = function( req, res, next ){
    req.assert( 'template_name', 'isString' );
    req.assert( 'channel', 'isString' );
    req.assert( 'data', 'isObject' );
    req.assert( 'webhook', 'isString' );

    if( !_.isEmpty( req.validationErrors ) ){
        util.handleValidationErrors( req, res );
        return next();
    }
    else{
        var slackPayload = {};
        if( _.isObject( req.params.options ) ){
            slackPayload = req.params.options;
        }

        _this._getTemplate( req.params.template_name, req.params.data )
            .then( function( result ){
                slackPayload[ 'text' ] = entities.decode( result.template );
                slackPayload[ 'channel' ] = req.params.channel;

                request.post( {
                    url: req.params.webhook,
                    json: slackPayload
                }, function( err, response, body ){
                    if( err ){
                        logger.error( 'slack', req.params.template_name + ' ' + JSON.stringify( err ), {
                            req: req
                        } );
                        res.send( 400, {} );
                    }
                    else{
                        if( response.statusCode === 200 || response.statusCode === 201 ){
                            logger.info( 'slack', req.params.template_name + ' has been sent to ' + req.params.channel, {
                                req: req,
                                data: req.params.data

                            } );
                            res.send( 200, {} );
                        }
                        else{
                            logger.error( 'slack', req.params.template_name + ' ' + JSON.stringify( body ), {
                                req: req
                            } );
                            res.send( 400, {} );
                        }
                    }
                } );
            } )
            .catch( function( err ){
                _this.handleError( err, req, res );
                return next();
            } )
    }
};
