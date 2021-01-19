var _ = require( 'lodash' );
var fs = require( 'fs' );
var uuid = require( 'node-uuid' );
var Handlebars = require( 'handlebars' );
var wkhtmltopdf = require( 'wkhtmltopdf' );
var Promise = require( 'bluebird' );

var config = require( '../config/config.json' );
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );

const templatePath = __dirname + '/../templates';
var _this = this;

require( '../lib/akx.handlebars.js' )();

exports.handleError = function( err, req, res ){
    util.handleError( 'pdf', err, req, res );
};

exports._getTemplate = function( template_name, data, section, options ){
    return new Promise( function( resolve, reject ){

        var templateDirectory = templatePath + '/' + template_name;
        var wrapperData = fs.readFileSync( templatePath + '/wrapper.hbs', 'utf8' );
        var dirStat = fs.lstatSync( templateDirectory );

        // Compile Options
        var defaultOptions = { strict: true };
        if( _.isEmpty( options ) ){
            options = defaultOptions;
        }
        else{
            options = _.merge( defaultOptions, options );
        }

        // data
        if( _.isEmpty( data ) ){
            data = {};
        }

        if( !dirStat.isDirectory() ){
            reject( new Error( 'Invalid template information' ) );
        }
        else{
            var files = fs.readdirSync( templateDirectory );

            if( _.indexOf( files, section + '.hbs' ) === -1 ){
                reject( new Error( 'Cannot find ' + section + '.hbs in ' + templateDirectory ) );
            }
            var currentFile = fs.readFileSync( templateDirectory + '/' + section + '.hbs', 'utf8' );
            var template = Handlebars.compile( currentFile, options );
            var compiledTemplate = template( data );

            Handlebars.registerPartial( 'body', compiledTemplate );
            var wrapperTemplate = Handlebars.compile( wrapperData );
            resolve( wrapperTemplate( data ) );

        }
    } );
};

exports.create = function( req, res, next ){

    req.assert( 'template_name', 'isString' );
    req.assert( 'data', 'isObject' );

    if( !_.isEmpty( req.validationErrors ) ){
        util.handleValidationErrors( req, res );
        return next();
    }
    else{
        var documentName = uuid.v4();
        var urlData = encodeURIComponent( JSON.stringify( req.params.data ) );
        var templateDirectory = templatePath + '/' + req.params.template_name;
        Promise.bind( {} )
            .then( function( finalHtml ){
                return new Promise( function( resolve, reject ){

                    var dirStat = fs.lstatSync( templateDirectory );

                    if( !dirStat.isDirectory() ){
                        reject( new Error( 'Invalid template information' ) );
                    }
                    else{
                        var files = fs.readdirSync( templateDirectory );

                        var wkOptions = {
                            output: 'tmp/' + documentName + '.pdf',
                            pageSize: 'letter',
                            marginBottom: 30,
                            marginTop: 5,
                            marginRight: 5,
                            marginLeft: 5,
                            zoom: 0.80,
                            lowquality: true
                        };

                        if( !_.isEmpty( req.params.options ) ){
                            wkOptions = _.merge( wkOptions, req.params.options );
                        }

                        if( _.indexOf( files, 'header.hbs' ) !== -1 ){
                            wkOptions[ 'headerHtml' ] = true;
                        }

                        if( _.indexOf( files, 'footer.hbs' ) !== -1 ){
                            wkOptions[ 'footerHtml' ] = true;
                        }

                        resolve( wkOptions );

                    }
                } );
            } )
            .then( function( wkOptions ){
                return new Promise( function( resolve, reject ){
                    if( wkOptions[ 'headerHtml' ] ){
                        _this._getTemplate( req.params.template_name, req.params.data, 'header', { strict: false } )
                            .then( function( headerHtmlRaw ){
                                fs.writeFile( 'tmp/' + documentName + '_header.html', headerHtmlRaw, function( err ){
                                    if( err ) throw err;
                                    wkOptions[ 'headerHtml' ] = config.base.host + '/pdfs/' + documentName + '_header.html';
                                    resolve( wkOptions );
                                } )
                            } );
                    }
                    else{
                        resolve( wkOptions );
                    }
                } );
            } )
            .then( function( wkOptions ){
                return new Promise( function( resolve, reject ){
                    if( wkOptions[ 'footerHtml' ] ){
                        _this._getTemplate( req.params.template_name, req.params.data, 'footer', { strict: false } )
                            .then( function( footerHtmlRaw ){
                                fs.writeFile( 'tmp/' + documentName + '_footer.html', footerHtmlRaw, function( err ){
                                    if( err ) throw err;
                                    wkOptions[ 'footerHtml' ] = config.base.host + '/pdfs/' + documentName + '_footer.html';
                                    resolve( wkOptions );
                                } )
                            } );
                    }
                    else{
                        resolve( wkOptions );
                    }
                } );

            } )
            .then( function( wkOptions ){
                return new Promise( function( resolve, reject ){
                    _this._getTemplate( req.params.template_name, req.params.data, 'body', { strict: false } )
                        .then( function( bodyHtmlRaw ){
                            fs.writeFile( 'tmp/' + documentName + '_body.html', bodyHtmlRaw, function( err ){
                                if( err ) throw err;
                                wkhtmltopdf( config.base.host + '/pdfs/' + documentName + '_body.html',
                                    wkOptions,
                                    function( code, signal ){
                                        resolve();
                                    } );
                            } )
                        } );

                } );

            } )
            .then( function(){
                // Read the file
                return new Promise( function( resolve, reject ){
                    fs.readFile( 'tmp/' + documentName + '.pdf', function( err, file ){
                        if( err ){
                            reject( err );
                        }
                        else{
                            resolve( file );
                        }
                    } );
                } );
            } )
            .then( function( file ){
                // Send the base64 info from the fileStream
                var base64Data = file.toString( 'base64' );
                logger.info( 'pdf', 'created ' + documentName + '.pdf', {
                    req: req
                } );

                res.send( 201, {
                    data: base64Data
                } );
            } )
            .catch( function( err ){
                util.handleError( 'pdf', err, req, res );
            } )
            .finally( function(){
                if( fs.existsSync( 'tmp/' + documentName + '.pdf' ) ){
                    fs.unlinkSync( 'tmp/' + documentName + '.pdf' );
                }

                if( fs.existsSync( 'tmp/' + documentName + '_header.html' ) ){
                    fs.unlinkSync( 'tmp/' + documentName + '_header.html' );
                }

                if( fs.existsSync( 'tmp/' + documentName + '_footer.html' ) ){
                    fs.unlinkSync( 'tmp/' + documentName + '_footer.html' );
                }

                if( fs.existsSync( 'tmp/' + documentName + '_body.html' ) ){
                    fs.unlinkSync( 'tmp/' + documentName + '_body.html' );
                }
                return next();
            } );
    }
};

exports.view = function( req, res, next ){

    req.assert( 'file_name', 'isString' );

    if( !_.isEmpty( req.validationErrors ) ){
        util.handleValidationErrors( req, res );
        return next();
    }
    else{
        var fileData = fs.readFileSync( __dirname + '/../tmp/' + req.params.file_name, 'utf8' );
        Promise.bind( {} )

            .then( function( result ){
                res.writeHead( 200, {
                    'Content-Length': Buffer.byteLength( fileData ),
                    'Content-Type': 'text/html'
                } );

                res.write( fileData );
                res.end();
            } )
            .catch( function( err ){
                util.handleError( 'pdf', err, req, res );
            } )
            .finally( function(){
                return next();
            } );
    }
};