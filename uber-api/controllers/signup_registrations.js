var _ = require( 'lodash' );
_.mixin( require( 'lodash-deep' ) );
var moment = require( 'moment-timezone' );
var mongoose = require( 'mongoose' );
var signupRegistration = mongoose.model( 'Registration' );
var signupUser = mongoose.model( 'User' );
var signupDocumentType = mongoose.model( 'DocumentType' );

var db = require( '../models' );
var User = db.User;
var UserSetting = db.UserSetting;
var Company = db.Company;
var Account = db.Account;
var Document = db.Document;
var Currency = db.Currency;
var Fee = db.Fee;
var UberCompanySetting = require( '../models_uber' ).UberCompanySetting;
var UberRiskScore = require( '../models_uber' ).UberRiskScore;
var apiConfig = require( '../config/config' ).api;
var config = require( '../config/config' );

var instDb = require( '../models_institution' );
var CompanyRelationship = instDb.CompanyRelationship;

var logger = require( '../lib/akx.logger.js' );
var notifier = require( '../lib/akx.notifier.js' );
var util = require( '../lib/akx.util.js' );
var request = require( 'request' );
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'onboarding', err, req, res );
};

exports.index = function( req, res, next ){
    if( _.isEmpty( req.validationErrors ) ){

        var options = {};
        var query = {};

        req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
        req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );

        var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
        if( paged ){
            options.skip = ( req.params.page - 1 ) * req.params.per_page;
            options.limit = req.params.per_page;
            options.sort = { modified: -1 };
        }

        if( req.params.hasOwnProperty( 'status' ) ){
            query[ 'status' ] = req.params.status;
        }

        if( req.params.hasOwnProperty( 'institution' ) && req.params.institution === '1' ){
            query[ 'institution_id' ] = { $exists: true, $ne: null };
        }
        else{
            query[ 'institution_id' ] = { $exists: false };
        }

        signupRegistration.find( query, null, options, function( err, registrations ){
            if( err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{

                if( paged ){
                    signupRegistration.count( {}, function( err, registrationsCount ){
                        if( err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else{
                            var totalPages = 1;
                            var pageRatio = registrationsCount / req.params.per_page;
                            totalPages = Math.floor( pageRatio );
                            if( pageRatio % 1 > 0 ){
                                totalPages++;
                            }

                            res.send( 200, { registrations: registrations, meta: { total_pages: totalPages } } );
                            return next();
                        }
                    } );
                }
                else{
                    res.send( 200, { registrations: registrations, meta: { total_pages: 1 } } );
                    return next();
                }
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
        var options = {};
        var query = {};

        req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
        req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );

        var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
        if( paged ){
            options.skip = ( req.params.page - 1 ) * req.params.per_page;
            options.limit = req.params.per_page;
            options.sort = { modified: -1 };
        }


        var regExString = '\\w*' + req.params.value.trim() + '*\\w|';
        regExString = regExString.substring( 0, regExString.length - 1 );
        var regExp = new RegExp( regExString, "i" );

        signupRegistration.find( {
            $or: [
                { "user.email": regExp },
                { "user.first_name": regExp },
                { "company.last_name": regExp },
                { "company.name": regExp }
            ]
        }, null, options, function( err, registrations ){
            if( err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                if( paged ){
                    signupRegistration.count( {
                        $or: [
                            { "user.email": regExp },
                            { "user.first_name": regExp },
                            { "company.last_name": regExp },
                            { "company.name": regExp }
                        ]
                    }, function( err, registrationsCount ){
                        if( err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else{
                            var totalPages = 1;
                            var pageRatio = registrationsCount / req.params.per_page;
                            totalPages = Math.floor( pageRatio );
                            if( pageRatio % 1 > 0 ){
                                totalPages++;
                            }

                            res.send( 200, { registrations: registrations, meta: { total_pages: totalPages } } );
                            return next();
                        }
                    } );
                }
                else{
                    res.send( 200, { registrations: registrations, meta: { total_pages: 1 } } );
                    return next();
                }
            }
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.view = function( req, res, next ){
    req.assert( 'registration_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        signupRegistration.findOne( {
            $and: [
                { _id: mongoose.Types.ObjectId( req.params.registration_id ) }
            ]
        }, function( err, registration ){
            res.send( 200, { registration: registration } );
            return next();
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.update = function( req, res, next ){
    req.assert( 'registration_id', 'isString' );
    req.assert( 'registration', 'isObject' );

    if( _.isEmpty( req.validationErrors ) ){
        signupRegistration.findOne( {
            $and: [
                { _id: mongoose.Types.ObjectId( req.params.registration_id ) },
            ]
        }, function( err, oldRegistration ){
            if( err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( _.isEmpty( oldRegistration ) ){
                logger.info( 'onboarding', 'registration not found [' + oldRegistration._id + ']', {
                    req: req
                } );

                res.send( 400, {
                    errors: [
                        { registration_id: [ 'An internal error has occurred' ] }
                    ]
                } );
                return next();
            }
            else{
                var update = {
                    $set: {}
                };

                var keys = [
                    'user',
                    'company',
                    'tradingVolume',
                    'owners',
                    'executives'
                ];

                if( _.isString( req.params.registration.account_type ) && req.params.registration.account_type !== oldRegistration.account_type ){
                    update[ '$set' ][ 'account_type' ] = req.params.registration.account_type;
                }

                _.forEach( keys, function( index ){
                    if( _.has( req.params.registration, index ) ){
                        _.forEach( req.params.registration[ index ], function( item, key ){
                            update[ '$set' ][ index + '.' + key ] = item;
                        } );
                    }
                } );

                signupRegistration.update( { _id: oldRegistration._id }, update, function( err, numberAffected ){
                    if( err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else if( numberAffected === 0 ){
                        logger.error( 'onboarding', 'registration [' + oldRegistration._id + '] not updated', {
                            req: req
                        } );

                        res.send( 400, {
                            errors: [ 'An internal error has occurred' ]
                        } );
                        return next();
                    }
                    else{
                        res.send( 200, {} );
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

exports.updateInquiries = function( req, res, next ){
    req.assert( 'registration_id', 'isString' );
    req.assert( 'inquiries', 'isArray' );

    if( _.isEmpty( req.validationErrors ) ){
        signupRegistration.findOne( {
            $and: [
                { _id: mongoose.Types.ObjectId( req.params.registration_id ) },
            ]
        }, function( err, oldRegistration ){

            _.forEach( req.params.inquiries, function( value, key ){
                for( var i = 0; i < oldRegistration.inquiries.length; i++ ){
                    if( oldRegistration.inquiries[ i ].question === value.question ){
                        oldRegistration.inquiries[ i ].answer = value.answer;
                    }
                }
            } );

            signupRegistration.update( { _id: oldRegistration._id }, { $set: { inquiries: oldRegistration.inquiries } }, function( err, numberAffected ){
                if( err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( numberAffected === 0 ){
                    logger.error( 'onboarding', 'registration [' + oldRegistration._id + '] not updated', {
                        req: req
                    } );

                    res.send( 500, {
                        errors: [ 'An internal error has occurred' ]
                    } );
                    return next();
                }
                else{
                    res.send( 200, {} );
                    return next();
                }
            } );
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.updateStep = function( req, res, next ){
    req.assert( 'registration_id', 'isString' );
    req.assert( 'route', 'isString' );
    req.assert( 'status', 'isIn', [ 0, 1 ] );

    if( _.isEmpty( req.validationErrors ) ){
        signupRegistration.findOne( {
            $and: [
                { _id: mongoose.Types.ObjectId( req.params.registration_id ) }
            ]
        }, function( err, registration ){
            if( err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( _.isEmpty( registration ) ){
                res.send( 400, {
                    errors: [
                        { registration_id: [ 'Cannot find registration' ] }
                    ]
                } );
                return next();
            }
            else{
                signupRegistration.update( {
                    $and: [
                        { _id: mongoose.Types.ObjectId( req.params.registration_id ) },
                        { "appSteps.route": req.params.route }
                    ]
                }, {
                    $set: { "appSteps.$.status": req.params.status }
                }, function( err, numberAffected ){
                    if( err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else if( numberAffected === 0 ){
                        logger.error( 'onboarding', 'failed to update step [' + registration._id + ']', {
                            req: req
                        } );

                        res.send( 500, {
                            errors: [ 'An internal error has occurred' ]
                        } );
                        return next();
                    }
                    else{
                        res.send( 200, { registration: registration } );
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

exports.createDocument = function( req, res, next ){
    req.assert( 'registration_id', 'isString' );
    req.assert( 'document_type', 'isString' );

    var exemption = req.params.hasOwnProperty( 'exemption' ) && req.params.exemption === true;

    // Exemption
    if( exemption ){
        req.assert( 'exemption', 'isBoolean' );
        req.assert( 'exemption_reason', 'isString' );
    }
    else{
        req.assert( 'document_id', 'isString' );
        req.assert( 'name', 'isString' );
        req.assert( 'type', 'isString' );
    }

    if( _.isEmpty( req.validationErrors ) ){
        var document = {
            _id: mongoose.Types.ObjectId(),
            status: 1,
            document_type: req.params.document_type
        };

        if( exemption ){
            document[ 'exemption' ] = true;
            document[ 'name' ] = 'Exemption';
        }
        else{
            document[ 'document_id' ] = mongoose.Types.ObjectId( req.params.document_id );
            document[ 'name' ] = req.params.name;
            document[ 'type' ] = req.params.type;
            document[ 'exemption' ] = false;
            document[ 'exemption_reason' ] = req.params.exemption_reason;
        }

        signupRegistration.update(
            {
                $and: [
                    { _id: mongoose.Types.ObjectId( req.params.registration_id ) }
                ]
            },
            { $push: { documents: document } },
            {},
            function( err, numberAffected, raw ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( numberAffected === 0 ){
                    res.send( 400, {
                        errors: [
                            { registration_id: [ 'Registration not updated' ] }
                        ]
                    } );

                    logger.error( 'documents', 'failed to create document[' + req.params.document_id + '] on [' + req.params.registration_id + ']', {
                        req: req
                    } );

                    return next();
                }
                else{
                    res.send( 201, { document: document } );
                    return next();
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.updateDocument = function( req, res, next ){
    req.assert( 'registration_id', 'isString' );
    req.assert( 'sub_document_id', 'isString' );
    req.assert( 'document', 'isObject' );

    if( _.isEmpty( req.validationErrors ) ){

        var fields = [
            'document_type',
            'exemption_reason',
            'verified',
            'notes',
            'expiration'
        ];

        var updateQuery = { $set: {} };
        var verified = false;
        _.forEach( fields, function( item ){
            if( req.params.document.hasOwnProperty( item ) ){
                updateQuery.$set[ 'documents.$.' + item ] = req.params.document[ item ];

                if( item === 'verified' && req.params.document[ item ] === true ){
                    updateQuery.$set[ 'documents.$.verified_user_id' ] = req.user.id;
                    updateQuery.$set[ 'documents.$.verified_date' ] = Date.now();
                }
            }
        } );

        signupRegistration.update( {
                $and: [
                    { "_id": mongoose.Types.ObjectId( req.params.registration_id ) },
                    { "documents._id": mongoose.Types.ObjectId( req.params.sub_document_id ) }
                ]
            },
            updateQuery, {},
            function( err, numberAffected, raw ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( numberAffected === 0 ){
                    res.send( 400, {
                        errors: [
                            'Cannot find registration or document'
                        ]
                    } );

                    logger.error( 'documents', 'failed for document[' + req.params.document_id + '] on [' + req.params.registration_id + ']', {
                        req: req
                    } );
                    return next();
                }
                else{
                    res.send( 200, {} );
                    return next();
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.removeDocument = function( req, res, next ){
    req.assert( 'registration_id', 'isString' );
    req.assert( 'sub_document_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        signupRegistration.update( {
                $and: [
                    { "_id": mongoose.Types.ObjectId( req.params.registration_id ) },
                    { "documents._id": mongoose.Types.ObjectId( req.params.sub_document_id ) }
                ]
            },
            { $set: { "documents.$.status": 0 } }, {},
            function( err, numberAffected, raw ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( numberAffected === 0 ){
                    logger.error( 'documents', 'failed for document[' + req.params.sub_document_id + '] on [' + req.params.registration_id + ']', {
                        req: req
                    } );

                    res.send( 400, {
                        errors: [
                            'Cannot find registration or document'
                        ]
                    } );
                    return next();
                }
                else{
                    res.send( 200, {} );
                    return next();
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

var _getValidationErrors = function( registration, callback ){
    var errors = [];

    if( _.isString( registration.account_type ) ){

        var fieldValidations = [
            {
                field: 'status', validation: function( value ){
                    return value === 1;
                }, error: { level: 1, message: 'Application not completed' }
            },
            {
                field: 'account_type', validation: function( value ){
                    var accountTypes = [
                        'personal',
                        'business'
                    ];
                    return _.indexOf( accountTypes, value ) !== -1;
                }, error: { level: 0, message: 'Account type invalid' }
            },
            { field: 'user.email', validation: _.isString, error: { level: 0, message: 'User email is required' } },
            {
                field: 'user.first_name',
                validation: _.isString,
                error: { level: 0, message: 'User first name is required' }
            },
            {
                field: 'user.last_name',
                validation: _.isString,
                error: { level: 0, message: 'User last name is required' }
            },
            {
                field: 'user.phone_mobile',
                validation: _.isString,
                error: { level: 0, message: 'User mobile number is required' }
            },
            { field: 'user.id_type', validation: _.isString, error: { level: 0, message: 'User ID type is required' } },
            {
                field: 'user.id_num',
                validation: _.isString,
                error: { level: 0, message: 'User ID number number is required' }
            },
            {
                field: 'user.date_of_birth',
                validation: _.isDate,
                error: { level: 0, message: 'User date of birth is required' }
            },

            {
                field: 'userAgreement.city',
                validation: _.isString,
                error: { level: 0, message: 'Agreement city is required' }
            }
        ];

        if( !!registration.hasOwnProperty( 'user_id' ) && registration.hasOwnProperty( 'institution_id' ) ){
            fieldValidations.push(
                {
                    field: 'institution_id', validation: function( value ){
                        return !_.isEmpty( value )
                    }, error: { level: 0, message: 'Institution ID must not be empty' }
                },
                {
                    field: 'institution_id',
                    validation: _.isString,
                    error: { level: 0, message: 'Institution ID must be string' }
                }
            );
        }

        if( registration.hasOwnProperty( 'user_id' ) && !!registration.hasOwnProperty( 'institution_id' ) ){
            fieldValidations.push(
                {
                    field: 'user_id', validation: function( value ){
                        return !_.isEmpty( value )
                    }, error: { level: 0, message: 'User ID must not be empty' }
                },
                {
                    field: 'user_id',
                    validation: _.isString,
                    error: { level: 0, message: 'User ID must be string' }
                }
            );
        }

        if( !!registration.hasOwnProperty( 'institution_id' ) && !!registration.hasOwnProperty( 'user_id' ) ){
            fieldValidations.push(
                {
                    field: 'institution_id', validation: function( value ){
                        return !_.isEmpty( value )
                    }, error: { level: 0, message: 'Institution ID must not be empty' }
                }
            );
            fieldValidations.push(
                {
                    field: 'user_id', validation: function( value ){
                        return !_.isEmpty( value )
                    }, error: { level: 0, message: 'User ID must not be empty' }
                }
            );
        }

        if( _.isString( registration.account_type ) && registration.account_type === 'business' ){
            fieldValidations = _.union( fieldValidations, [
                {
                    field: 'company.name',
                    validation: _.isString,
                    error: { level: 0, message: 'Company name is required' }
                },
                {
                    field: 'company.address',
                    validation: _.isString,
                    error: { level: 0, message: 'Company address is required' }
                },
                {
                    field: 'company.city',
                    validation: _.isString,
                    error: { level: 0, message: 'Company city is required' }
                },
                {
                    field: 'company.state_province',
                    validation: _.isString,
                    error: { level: 0, message: 'Company state/province is required' }
                },
                {
                    field: 'company.postal_code',
                    validation: _.isString,
                    error: { level: 0, message: 'Company postal code is required' }
                },
                {
                    field: 'company.country',
                    validation: _.isString,
                    error: { level: 0, message: 'Company country is required' }
                },
                {
                    field: 'company.trading_address',
                    validation: _.isString,
                    error: { level: 0, message: 'Company trading address is required' }
                },
                {
                    field: 'company.trading_city',
                    validation: _.isString,
                    error: { level: 0, message: 'Company trading city is required' }
                },
                {
                    field: 'company.trading_postal_code',
                    validation: _.isString,
                    error: { level: 0, message: 'Company trading postal code is required' }
                },
                {
                    field: 'company.trading_state_province',
                    validation: _.isString,
                    error: { level: 0, message: 'Company trading state is required' }
                },
                {
                    field: 'company.trading_country',
                    validation: _.isString,
                    error: { level: 0, message: 'Company trading country is required' }
                },
                {
                    field: 'company.tax_num',
                    validation: _.isString,
                    error: { level: 0, message: 'Company tax number is required' }
                },
                {
                    field: 'company.company_number',
                    validation: _.isString,
                    error: { level: 0, message: 'Company number is required' }
                }
            ] );
        }

        signupDocumentType.find( { account_type: registration.account_type }, null, { sort: { created: 'desc' } }, function( err, documentTypes ){
            if( err ){
                callback( err );
            }
            else{

                // Field Validations
                _.forEach( fieldValidations, function( test ){
                    var value = _.deepGet( registration, test.field );
                    if( typeof value === 'undefined' || !test.validation( value ) ){
                        errors.push( test.error );
                    }
                } );

                // AppSteps
                _.forEach( registration.appSteps, function( appStep ){
                    if( appStep.status !== 1 ){
                        errors.push( { message: appStep.name + ' step is incomplete', level: 1 } );
                    }
                } );

                // Inquiries
                _.forEach( registration.inquiries, function( inquiry ){
                    if( inquiry.required === true && _.isEmpty( inquiry.answer ) ){
                        errors.push( { message: inquiry.question + ' is missing', level: 1 } );
                    }
                } );

                // Documents
                _.forEach( documentTypes, function( documentType ){
                    if( documentType.name !== 'w8_ben' || !_.isString( registration.company.country ) || registration.company.country !== 'US' ){
                        var found = false;
                        var documentErrors = [];
                        _.forEach( registration.documents, function( document ){
                            if( document.status === 1 ){

                                if( documentType.name === document.document_type ){
                                    found = true;

                                    if( document.verified !== true ){
                                        if( document.exemption === true ){
                                            documentErrors.push( {
                                                message: 'Unverified document: ' + documentType.display_name + ' Exemption',
                                                level: 1
                                            } );
                                        }
                                        else{
                                            documentErrors.push( {
                                                message: 'Unverified document: ' + document.name,
                                                level: 1
                                            } );
                                        }
                                    }
                                }
                            }
                        } );

                        if( !found ){
                            if( documentType.exemptible === false ){
                                errors.push( { message: 'Missing ' + documentType.display_name, level: 1 } );
                            }
                        }

                        errors = _.union( errors, documentErrors );
                    }
                } );

                return callback( null, errors );
            }
        } );
    }
    else{
        errors.push( { message: 'Account type not selected', level: 0 } );

        return callback( null, errors );
    }
};

exports.validation = function( req, res, next ){



    req.assert( 'registration_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        signupRegistration.findOne( {
            $and: [
                { _id: mongoose.Types.ObjectId( req.params.registration_id ) }
            ]
        }, function( err, registration ){
            if( err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( _.isEmpty( registration ) ){
                res.send( 400, {
                    errors: [
                        { registration_id: [ 'Cannot find registration' ] }
                    ]
                } );
                return next();
            }
            else{
                _getValidationErrors( registration, function( err, validationErrors ){
                    if( err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else{
                        res.send( 200, { validationErrors: validationErrors } );
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

exports.complete = function( req, res, next ){

    req.assert( 'registration_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        // Find email
        signupRegistration.findOne( {
                $and: [
                    { _id: mongoose.Types.ObjectId( req.params.registration_id ) }
                ]
            },
            function( err, registration ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !registration ){
                    res.send( 400, {
                        errors: [
                            { registration_id: [ 'Registration not found' ] }
                        ]
                    } );

                    return next();
                }
                else if( registration.status !== 0 ){
                    res.send( 400, {
                        errors: [
                            'Registration already completed'
                        ]
                    } );

                    return next();
                }
                else{
                    signupRegistration.update( { _id: registration._id },
                        { $set: { status: 1 } },
                        {}, function( err, numberAffected ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else if( numberAffected === 0 ){
                                logger.error( 'onboarding', 'registration not updated [' + registration._id + ']', {
                                    req: req
                                } );

                                res.send( 500, {
                                    errors: [
                                        'Registration not updated'
                                    ]
                                } );
                                return next();
                            }
                            else{
                                logger.info( 'onboarding', 'registration completed [' + registration._id + ']', {
                                    req: req
                                } );

                                res.send( 200, {} );
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

exports.reopen = function( req, res, next ){

    req.assert( 'registration_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        // Find email
        signupRegistration.findOne( {
                $and: [
                    { _id: mongoose.Types.ObjectId( req.params.registration_id ) }
                ]
            },
            function( err, registration ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !registration ){
                    res.send( 400, {
                        errors: [
                            { registration_id: [ 'Registration not found' ] }
                        ]
                    } );

                    return next();
                }
                else if( registration.status === 0 ){
                    res.send( 400, {
                        errors: [
                            'Registration already open'
                        ]
                    } );

                    return next();
                }
                else if( registration.status !== 1 ){
                    res.send( 400, {
                        errors: [
                            'Registration already already activated and cannot be reopened'
                        ]
                    } );

                    return next();
                }
                else{
                    signupRegistration.update( { _id: registration._id },
                        { $set: { status: 0 } },
                        {}, function( err, numberAffected ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else if( numberAffected === 0 ){
                                logger.error( 'onboarding', 'registration not updated [' + registration._id + ']', {
                                    req: req
                                } );

                                res.send( 500, {
                                    errors: [
                                        'Registration not updated'
                                    ]
                                } );
                                return next();
                            }
                            else{
                                logger.info( 'onboarding', 'registration reopened [' + registration._id + ']', {
                                    req: req
                                } );

                                res.send( 200, {} );
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

exports.status = function( req, res, next ){

    req.assert( 'registration_id', 'isString' );
    req.assert( 'status', 'isIn', [ 0, 1, 3, 4 ] );

    if( _.isEmpty( req.validationErrors ) ){

        signupRegistration.findOne( {
                $and: [
                    { _id: mongoose.Types.ObjectId( req.params.registration_id ) }
                ]
            },
            function( err, registration ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !registration ){
                    res.send( 400, {
                        errors: [
                            { registration_id: [ 'Registration not found' ] }
                        ]
                    } );

                    return next();
                }
                else{
                    signupUser.findOne( {
                        _id: registration.user_id
                    }, function( err, user ){
                        if( err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else if( _.isEmpty( user ) ){
                            res.send( 400, {
                                errors: [ 'User not found' ]
                            } );
                            return next();
                        }
                        else{

                            var userStatus = 1; // Active
                            var registrationAction;
                            var userAction = 'active';
                            switch( req.params.status ){
                                case 0:
                                    registrationAction = 'in-progress';
                                    break;
                                case 1:
                                    registrationAction = 'complete';
                                    break;
                                case 3:
                                    userStatus = 0;
                                    registrationAction = 'on-hold';
                                    userAction = 'unactive';
                                    break;
                                case 4:
                                    userStatus = 0;
                                    registrationAction = 'archived';
                                    userAction = 'unactive';
                                    break;
                            }

                            signupRegistration.update( { _id: registration._id },
                                { $set: { status: req.params.status } },
                                {}, function( err, numberAffected ){
                                    if( !!err ){
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else if( numberAffected === 0 ){
                                        logger.error( 'onboarding', 'registration not updated [' + registration._id + ']', {
                                            req: req
                                        } );

                                        res.send( 500, {
                                            errors: [
                                                'Registration not updated'
                                            ]
                                        } );
                                        return next();
                                    }
                                    else{

                                        logger.info( 'onboarding', 'registration marked ' + registrationAction + ' [' + registration._id + ']', {
                                            req: req
                                        } );

                                        signupUser.update( { _id: user._id },
                                            { $set: { status: userStatus } },
                                            {}, function( err, numberAffected ){
                                                if( !!err ){
                                                    _this.handleError( err, req, res );
                                                    return next();
                                                }
                                                else if( numberAffected === 0 ){
                                                    logger.error( 'onboarding', 'user not updated [' + user._id + ']', {
                                                        req: req
                                                    } );

                                                    res.send( 500, {
                                                        errors: [
                                                            'User not updated'
                                                        ]
                                                    } );
                                                    return next();
                                                }
                                                else{
                                                    logger.info( 'onboarding', 'user marked ' + userAction + ' [' + user._id + ']', {
                                                        req: req
                                                    } );

                                                    res.send( 200, {} );
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


exports.activate = function( req, res, next ){
    req.assert( 'registration_id', 'isString' );
    req.assert( 'account_number', 'isString' );
    req.assert( 'riskScore', 'isNumber' );


    if( _.isEmpty( req.validationErrors ) ){

        Company.find(
            {
                where: { account_number: req.params.account_number }
            } )
            .done( function( err, company ){
                if( err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !_.isEmpty( company ) ){
                    res.send( 400, {
                        errors: [
                            { account_number: [ 'Account number already taken' ] }
                        ]
                    } );
                    return next();
                }
                else{

                    signupRegistration.findOne( {
                        $and: [
                            { _id: mongoose.Types.ObjectId( req.params.registration_id ) }
                        ]
                    }, function( err, registration ){
                        if( err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else if( _.isEmpty( registration ) ){
                            res.send( 400, {
                                errors: [
                                    { registration_id: [ 'Cannot find registration' ] }
                                ]
                            } );
                            return next();
                        }
                        else{
                            signupUser.findOne( {
                                _id: registration.user_id
                            }, function( err, user ){
                                if( err ){
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else if( _.isEmpty( user ) ){
                                    res.send( 400, {
                                        errors: [ 'User not found' ]
                                    } );
                                    return next();
                                }
                                else{
                                    Currency.find( { where: { id: 'USD' } } )
                                        .done( function( err, currency ){
                                            if( err ){
                                                _this.handleError( err, req, res );
                                                return next();
                                            }
                                            else if( _.isEmpty( currency ) ){
                                                res.send( 400, {
                                                    errors: [ 'Currency not found' ]
                                                } );
                                                return next();
                                            }
                                            else{
                                                _getValidationErrors( registration, function( err, validationErrors ){
                                                    if( err ){
                                                        _this.handleError( err, req, res );
                                                        return next();
                                                    }
                                                    else{
                                                        var canActivate = true;
                                                        _.forEach( validationErrors, function( errors ){
                                                            if( errors.level === 0 ){
                                                                canActivate = false;
                                                            }
                                                        } );

                                                        if( !canActivate ){
                                                            res.send( 400, { errors: [ 'Cannot activate' ] } );
                                                            return next();
                                                        }
                                                        else{

                                                            var newCompany = {
                                                                account_number: req.params.account_number,
                                                                fax: registration.company.phone_fax,
                                                                website: registration.company.website,
                                                                address: registration.company.address,
                                                                city: registration.company.city,
                                                                state_province: registration.company.state_province,
                                                                postal_code: registration.company.postal_code,
                                                                country: registration.company.country,
                                                                dual_custody: false,
                                                                type: 0
                                                            };

                                                            if( registration.account_type === 'business' ){
                                                                newCompany.name = registration.company.name;
                                                            }
                                                            else{
                                                                newCompany.name = registration.user.first_name + ' ' + registration.user.last_name;
                                                            }

                                                            Company.create( newCompany )
                                                                .done( function( err, newCompany ){
                                                                    if( err ){
                                                                        _this.handleError( err, req, res );
                                                                        return next();
                                                                    }
                                                                    else{
                                                                        UberRiskScore.create( {
                                                                            company_id: newCompany.id,
                                                                            score: req.params.riskScore
                                                                        } ).done( function( err, riskScore ){
                                                                            if( err ){
                                                                                _this.handleError( err, req, res );
                                                                                return next();
                                                                            }
                                                                            else{
                                                                                UberCompanySetting.create( {
                                                                                    company_id: newCompany.id,
                                                                                    registration_id: req.params.registration_id
                                                                                } ).done( function( err, newSetting ){
                                                                                    if( err ){
                                                                                        _this.handleError( err, req, res );
                                                                                        return next();
                                                                                    }
                                                                                    else{
                                                                                        request.get( {
                                                                                            url: apiConfig.host + '/info/permissions'
                                                                                        }, function( err, response, data ){
                                                                                            if( err ){
                                                                                                _this.handleError( err, req, res );
                                                                                                return next();
                                                                                            }
                                                                                            else{
                                                                                                Fee.create( {
                                                                                                    company_id: newCompany.id,
                                                                                                    fee_data: JSON.stringify( config.fee )
                                                                                                } );
                                                                                                User.create( {
                                                                                                    email: registration.user.email,
                                                                                                    first_name: registration.user.first_name,
                                                                                                    last_name: registration.user.last_name,
                                                                                                    hash: user.hash,
                                                                                                    company_id: newCompany.id,
                                                                                                    phone_mobile: registration.user.phone_mobile,
                                                                                                    access: data,
                                                                                                    status: 1
                                                                                                } ).done( function( err, newUser ){
                                                                                                    if( err ){
                                                                                                        _this.handleError( err, req, res );
                                                                                                        return next();
                                                                                                    }
                                                                                                    else{
                                                                                                        UserSetting.findOrCreate( {
                                                                                                            user_id: newUser.id
                                                                                                        } ).done( function( err, newAccount ){
                                                                                                            if( err ){
                                                                                                                _this.handleError( err, req, res );
                                                                                                                return next();
                                                                                                            }
                                                                                                            else{
                                                                                                                Account.create( {
                                                                                                                    company_id: newCompany.id,
                                                                                                                    currency_id: 'USD',
                                                                                                                    name: 'USD Account',
                                                                                                                    balance: 0.00
                                                                                                                } ).done( function( err, newAccount ){
                                                                                                                    if( err ){
                                                                                                                        _this.handleError( err, req, res );
                                                                                                                        return next();
                                                                                                                    }
                                                                                                                    else{
                                                                                                                        signupRegistration.update( { "_id": registration._id },
                                                                                                                            {
                                                                                                                                $set: {
                                                                                                                                    "status": 2,
                                                                                                                                    "company_id": newCompany.id
                                                                                                                                }
                                                                                                                            }, {},
                                                                                                                            function( err, numberAffected, raw ){
                                                                                                                                if( !!err ){
                                                                                                                                    _this.handleError( err, req, res );
                                                                                                                                    return next();
                                                                                                                                }
                                                                                                                                else if( numberAffected === 0 ){
                                                                                                                                    logger.info( 'onboarding', 'registration [' + registration._id + '] not updated', {
                                                                                                                                        req: req
                                                                                                                                    } );

                                                                                                                                    res.send( 400, { errors: [ 'Failed to update registration' ] } );
                                                                                                                                    return next();
                                                                                                                                }
                                                                                                                                else{
                                                                                                                                    signupUser.update( { "_id": registration.user_id },
                                                                                                                                        { $set: { "status": 2 } }, {},
                                                                                                                                        function( err, numberAffected, raw ){
                                                                                                                                            if( !!err ){
                                                                                                                                                _this.handleError( err, req, res );
                                                                                                                                                return next();
                                                                                                                                            }
                                                                                                                                            else if( numberAffected === 0 ){
                                                                                                                                                logger.info( 'onboarding', 'user [' + registration.user_id + '] not updated', {
                                                                                                                                                    req: req
                                                                                                                                                } );

                                                                                                                                                res.send( 400, { errors: [ 'Failed to update registration' ] } );
                                                                                                                                                return next();
                                                                                                                                            }
                                                                                                                                            else{
                                                                                                                                                if( registration.get( 'institution_id' ) ){
                                                                                                                                                    newUser.destroy().done( function( err ){
                                                                                                                                                        if( err ){
                                                                                                                                                            _this.handleError( err, req, res );
                                                                                                                                                            return next();
                                                                                                                                                        }
                                                                                                                                                        else{
                                                                                                                                                            CompanyRelationship.create( {
                                                                                                                                                                status: 1,
                                                                                                                                                                institution_id: registration.get( 'institution_id' ),
                                                                                                                                                                company_id: newCompany.id
                                                                                                                                                            } ).done( function( err, newCompRelationship ){
                                                                                                                                                                if( !!err ){
                                                                                                                                                                    _this.handleError( err, req, res );
                                                                                                                                                                    return next();
                                                                                                                                                                }
                                                                                                                                                                else{
                                                                                                                                                                    logger.info( 'onboarding', 'registration activated [' + registration._id + ']', {
                                                                                                                                                                        req: req
                                                                                                                                                                    } );
                                                                                                                                                                    notifier.notifyUser( 'reg-activated-v1', { account_number: 'XYZ' + newCompany.account_number }, req );
                                                                                                                                                                    res.send( 201, { company: newCompany } );
                                                                                                                                                                    return next();
                                                                                                                                                                }
                                                                                                                                                            } );
                                                                                                                                                        }
                                                                                                                                                    } );
                                                                                                                                                }
                                                                                                                                                else{
                                                                                                                                                    logger.info( 'onboarding', 'registration activated [' + registration._id + ']', {
                                                                                                                                                        req: req
                                                                                                                                                    } );
                                                                                                                                                    notifier.notifyUser( 'reg-activated-v1', newUser.values, { account_number: 'XYZ' + newCompany.account_number }, req );
                                                                                                                                                    res.send( 201, { company: newCompany } );
                                                                                                                                                    return next();
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        } );
                                                                                                                                }
                                                                                                                            } );
                                                                                                                    }
                                                                                                                } );
                                                                                                            }
                                                                                                        } );
                                                                                                    }
                                                                                                } );
                                                                                            }
                                                                                        } );
                                                                                    }

                                                                                } );
                                                                            }
                                                                        } );
                                                                    }
                                                                } );
                                                        }
                                                    }
                                                } );
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
