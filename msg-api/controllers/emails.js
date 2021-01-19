

var _ = require( 'lodash' );
var fs = require( 'fs' );
var moment = require( 'moment-timezone' );
var Handlebars = require( 'handlebars' );
var Promise = require( 'bluebird' );
var mandrill = require( 'mandrill-api/mandrill' );
var request = require( 'request' );

var logger = require( '../lib/akx.logger.js' );
var templateMap = require( '../config/templateMapEmail.json' );
var util = require( '../lib/akx.util.js' );

const templatePath = __dirname + '/../templates_html';
var _this = this;

require( '../lib/akx.handlebars.js' )();

exports.handleError = function( err, req, res ){
    util.handleError( 'email', err, req, res );
};


exports._getTemplate = function( template_name, email, data, options ){
    return new Promise( function( resolve, reject ){

        var defaultOptions = { strict: true };
        if( _.isEmpty( options ) ){
            options = defaultOptions;
        }
        else{
            options = _.merge( defaultOptions, options );
        }

        if( !_.has( templateMap, template_name ) ){
            reject( new Error( 'Cannot find template' ) );
        }
        else{
            fs.readFile( templatePath + '/' + template_name + '.hbs', 'utf8', function( err, templateData ){
                if( err ){
                    reject( err );
                }
                else if( _.isEmpty( templateData ) ){
                    reject( new Error( 'Template is empty' ) );
                }
                else{
                    try{
                        var template = Handlebars.compile( templateData, options );
                        var subjectTemplate = Handlebars.compile( templateMap[ template_name ].subject, options );

                        var compiledTemplate = template( data );
                        var compiledSubjectTemplate = subjectTemplate( data );

                        resolve( { subject: compiledSubjectTemplate, template: compiledTemplate } );
                    }
                    catch( err ){
                        reject( err );
                    }
                }
            } );
        }
    } );
};






exports.create = function( req, res, next ){

    req.assert( 'template_name', 'isString' );
    req.assert( 'email', 'isEmail' );
    req.assert( 'data', 'isObject' );
    req.assert( 'key', 'isString' );

    if( !_.isEmpty( req.validationErrors ) ){
        util.handleValidationErrors( req, res );
        return next();
    }
    else{
        var templateSettings = {};
        if( _.isObject( req.params.meta ) ){
            if( req.params.meta.strict === false ){
                templateSettings[ 'strict' ] = false;
            }
        }
        _this._getTemplate( req.params.template_name, req.params.email, req.params.data, templateSettings )
            .then( function( result ){
                var emailOptions;
                var mandrillClient = new mandrill.Mandrill( req.params.key );
                emailOptions = {
                    "message": {
                        html: result.template,
                        subject: result.subject,
                        "from_email": "support@acme.com",
                        "from_name": "Akirix",
                        "to": [
                            {
                                "email": req.params.email,
                                "name": req.params.recipient,
                                "type": "to"
                            }
                        ],
                        "important": false,
                        "track_opens": true,
                        "track_clicks": true,
                        "auto_text": true,
                        "view_content_link": false,
                        "merge": false
                    }
                };

                if( req.params.hasOwnProperty( 'sender' ) ){
                    emailOptions.message.from_email = req.params.sender.email;
                    emailOptions.message.from_name = req.params.sender.name;
                }

                if( req.params.hasOwnProperty( 'recipients' ) ){
                    emailOptions.message.to = req.params.recipients;
                }

                if( _.isString( req.params.recipient ) && !_.isEmpty( req.params.recipient ) ){
                    emailOptions.message.to[ 0 ][ 'name' ] = req.params.recipient;
                }

                if( _.isObject( req.params.meta ) ){

                    // Attachments
                    if( _.isArray( req.params.meta.attachments ) ){

                        emailOptions.message[ 'attachments' ] = [];

                        _.forEach( req.params.meta.attachments, function( attachment ){

                            if( _.isString( attachment.type ) && _.isString( attachment.name ) && _.isString( attachment.content ) ){
                                emailOptions.message.attachments.push( {
                                    type: attachment.type,
                                    name: attachment.name,
                                    content: attachment.content
                                } );
                            }
                        } );
                    }
                }

                mandrillClient.messages.send( emailOptions,
                    function( result ){
                        if( req.params.hasOwnProperty( 'recipients' ) ){
                            logger.info( 'email', req.params.template_name + ' sent to ' + req.params.recipients + ' ' + JSON.stringify( result ), {
                                req: req,
                                data: req.params.data
                            } );
                        }
                        else{
                            logger.info( 'email', req.params.template_name + ' sent to ' + req.params.email + ' ' + JSON.stringify( result ), {
                                req: req,
                                data: req.params.data
                            } );
                        }
                        res.send( 201, { mandrillResult: result } );
                        return next();

                    }, function( err ){
                        if( req.params.hasOwnProperty( 'recipients' ) ){
                            logger.error( 'email', req.params.template_name + ' ' + req.params.recipients + ' ' + JSON.stringify( err ), {
                                req: req
                            } );
                        }
                        else{
                            logger.error( 'email', req.params.template_name + ' ' + req.params.email + ' ' + JSON.stringify( err ), {
                                req: req
                            } );
                        }
                        res.send( 500, { mandrillResult: result } );
                        return next();
                    } );
            } )
            .catch( function( err ){
                _this.handleError( err, req, res );
                return next();
            } )
    }
};




exports.viewHtml = function( req, res, next ){

    req.assert( 'template_name', 'isString' );

    if( _.isEmpty( req.params.email ) ){
        req.params.email = 'test@test.com';
    }

    // Setup the mock data
    if( _.isEmpty( req.params.data ) ){
        if( _.has( templateMap[ req.params.template_name ], 'mock' ) && !_.isEmpty( templateMap[ req.params.template_name ].mock ) ){
            req.params.data = templateMap[ req.params.template_name ].mock;
        }
        else{
            req.params.data = {};
        }
    }

    // Get list of templateNames
    var templateList = [];
    var templateFiles = fs.readdirSync( templatePath );
    _.pull( templateFiles, 'base' );
    _.forEach( templateFiles, function( templateFile ){
        var templateName = templateFile.replace( '.hbs', '' );
        templateList.push( {
            name: templateName,
            link: '/emails/html?template_name=' + templateName,
            active: ( req.params.template_name === templateName )
        } );
    } );

    var previewTemplateHtml = fs.readFileSync( templatePath + '/base/preview.hbs', { encoding: 'utf8' } );
    var previewTemplate = Handlebars.compile( previewTemplateHtml );
    var previewData = { templateList: templateList, templateName: req.params.template_name };

    Promise.bind( {} )
        .then( function( mandrillTemplates ){
            if( _.isEmpty( req.validationErrors ) ){
                return _this._getTemplate( req.params.template_name, req.params.email, req.params.data, { strict: false } )
            }
        } )
        .then( function( templateInfo ){

            // Setup current template
            var currentTemplateHtml;
            if( !_.isEmpty( templateInfo ) ){
                currentTemplateHtml = templateInfo.template;
                previewData[ 'subject' ] = templateInfo.subject;
            }
            else{
                currentTemplateHtml = '<span style="color: #ccc;">No Template Selected</span>';
            }
            Handlebars.registerPartial( 'currentTemplate', currentTemplateHtml );

            var compiledPreviewTemplate = previewTemplate( previewData );
            res.writeHead( 200, {
                'Content-Length': Buffer.byteLength( compiledPreviewTemplate ),
                'Content-Type': 'text/html'
            } );

            res.write( compiledPreviewTemplate );
            res.end();

            return next();
        } )
        .catch( function( err ){
            _this.handleError( err, req, res );
            return next();
        } );
};






exports.getMandrillTemplates = function( req, res, next ){
    request.post( {
        url: 'https://mandrillapp.com/api/1.0/templates/list.json',
        form: { key: 'Ym_IeuaGdMAKWJx0amrC7A' },
        json: true
    }, function( err, httpResponse, body ){
        if( err ){
            res.send( 500 );
        }
        else{
            res.send( 200, body );
            return next();
        }
    } );
};