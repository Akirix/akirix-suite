


/**
 * @api Object *Registration Object
 * @apiName RegistrationsObject
 * @apiVersion 1.0.0
 * @apiGroup Registrations
 * @apiDescription All the fields for the Registration object
 *
 * @apiParam {Date} created Created date
 * @apiParam {Date} modified Modified date
 * @apiParam {String} user_id User id
 * @apiParam {Number} status Status
 * @apiParam {String} account_type Registration type: Business or Personal
 *
 * @apiParam {Object} company Company info
 * @apiParam {String} company.address Company's address
 * @apiParam {String} company.address_2 Company's address (cont.)
 * @apiParam {String} company.city Company's city
 * @apiParam {String} company.state_province Company's state or provinces
 * @apiParam {String} company.postal_code Company's postal code
 * @apiParam {String} company.country Company's country
 * @apiParam {String} company.trading_address Company's trading address
 * @apiParam {String} company.trading_city Company's trading city
 * @apiParam {String} company.trading_state_province Company's trading state or provinces
 * @apiParam {String} company.trading_postal_code Company's trading postal code
 * @apiParam {String} company.trading_country Company's trading country
 * @apiParam {Boolean} company.trading_same IS the trading address same as the user address?
 * @apiParam {String} company.phone_office Office phone
 * @apiParam {String} company.website Website
 * @apiParam {String} company.duns_number DUNS number
 * @apiParam {String} company.tax_num Tax number
 * @apiParam {String} company.tax_num_type Tax number type
 * @apiParam {String} company.company_number Company registration number
 *
 * @apiParam {Object[]} appSteps List of appStep
 * @apiParam {Boolean} appSteps.active True or false
 * @apiParam {String} appSteps.icon Icon for current step
 * @apiParam {String} appSteps.name Name for the step
 * @apiParam {Number} appSteps.order The order number of the step that is displayed on the sidebar
 * @apiParam {String} appSteps.route URI info for the route icon
 * @apiParam {Number} appSteps.status Flag to indicate if the step has been completed
 *
 * @apiParam {Object[]} inquiries List of inquiries
 * @apiParam {String} inquiries.question The inquiry question.
 * @apiParam {String} inquiries.answer Answer to inquiry.
 * @apiParam {String} inquiries.help_text Additional information about the inquiry
 * @apiParam {Boolean} inquiries.required If question is required to be answered
 * @apiParam {Number} inquiries.type Input type of the question
 * - 0:Text
 * - 1: Binary (yes/no)
 * @apiParam {String} inquiries.account_types Account types this inqury applies to: Business or personal
 * *
 * @apiParam {Object} user User info
 * @apiParam {Date} user.date_of_birth User's date of birth
 * @apiParam {String} user.email User's email
 * @apiParam {String} user.first_name User's first name
 * @apiParam {String} user.last_name User's last name
 * @apiParam {String} user.phone_mobile User's mobile number
 * @apiParam {String} user.phone_office User's office number
 * @apiParam {String} user.id_type ID Type
 * @apiParam {String} user.id_num ID Number
 *
 * @apiParam {Object} userAgreement Agreement signature
 * @apiParam {String} userAgreement.agreement_id Id of the agreement signed
 * @apiParam {String} userAgreement.city City
 * @apiParam {String} userAgreement.postal_code Postal Code
 * @apiParam {String} userAgreement.ip IP Address
 * @apiParam {Date} userAgreement.agreed_on Signature date
 *
 * @apiParam {Object[]} documents List of documents
 * @apiParam {String} documents.document_id Document object id
 * @apiParam {String} documents.document_type Web friendly name (no spaces, not case-sensitive) of the type of document.
 * @apiParam {String} documents.name File name of the document
 * @apiParam {String} documents.type The [MIME Media Type](http://www.iana.org/assignments/media-types/media-types.xhtml) of the uploaded document
 * @apiParam {Boolean} documents.exemption If the document-type is exempted from being required
 * @apiParam {String} documents.notes Notes for the document
 * @apiParam {String} documents.status Flag to indicate the state of the link
 * - 0: Archived
 * - 1: Active
 * - 2: Processed
 * @apiParam {String} documents.verified If the document has been verified
 * @apiParam {String} documents.verified_date Date the document was verified
 * @apiParam {String} documents.verified_user_id The user who verified the document
 * @apiParam {String} documents.exemption If the document is flagged as exempted
 * @apiParam {String} documents.exemption_reason Reason for exemption
 */




var mongoose = require( 'mongoose' );
var _ = require( 'lodash' );

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var notifier = require( '../lib/akx.notifier.js' );
var appConfig = require( '../config/config.json' ).app;
var moment = require( 'moment-timezone' );

var Registration = mongoose.model( 'Registration' );
var Verification = mongoose.model( 'Verification' );
var Agreement = mongoose.model( 'Agreement' );

var _this = this;

exports.handleError = function( err, req, res ){
    return util.handleError( 'registration', err, req, res );
};

/**
 * @method update
 * @description Updates a registration from the supplied params.
 * Only updates registration that have not been completed (status 0), does not effect
 * _id, user_id, created, or status.
 *
 * @param {object} req The request
 * @param {object} res The response
 * @param {function} next Calls the next function
 *
 * @return {Function} next
 */

/**
 * @api {put} /registrations/:registration_id Update Registration
 * @apiName RegistrationsUpdate
 * @apiVersion 1.0.0
 * @apiGroup Registrations
 *
 * @apiDescription Update the registration
 *
 * @apiParam {String} registration_id ID of the the current registration session
 * @apiParam {Object} registration Object that contains the registration information
 *
 * @apiError (400) {String[]} errors List of error messages
 * @apiSuccess (200) {Object} - Empty object
 *
 */
exports.update = function( req, res, next ){

    req.assert( 'registration_id', 'isString' );
    req.assert( 'registration', 'isObject' );
    req.assert( 'registration.user', 'isObject' );
    req.assert( 'registration.company', 'isObject' );

    if( !_.isEmpty( req.validationErrors ) ){
        util.handleValidationErrors( req, res );
        return next();
    }
    else if( _.isEmpty( req.body ) ){
        res.send( 400, {
            errors: [
                'Missing registration information'
            ]
        } );

        logger.error( 'registration', 'missing registration body', {
            req: req
        } );

        return next();
    }
    else{
        Registration.findOne( {
            $and: [
                { _id: mongoose.Types.ObjectId( req.params.registration_id ) },
                { user_id: mongoose.Types.ObjectId( req.authInfo._id ) },
                { status: 0 }
            ]
        }, function( err, oldRegistration ){
            if( err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( _.isEmpty( oldRegistration ) ){
                res.send( 400, {
                    errors: [
                        'Cannot find registration'
                    ]
                } );

                logger.info( 'registration', 'Cannot find [' + req.params.registration_id + ']', {
                    req: req
                } );
                return next();
            }
            else{

                var registration = req.body;
                var update = { $set: {} };
                var keys = [
                    'user',
                    'company',
                    'tradingVolume',
                    'owners',
                    'executives'
                ];

                // stores changes
                var changes = [];

                // Don't change the _id
                if( typeof registration._id !== 'undefined' ){
                    delete registration._id;
                }
                //if old account type does not equal new account type, pushes new value
                if( _.isString( req.params.registration.account_type ) && req.params.registration.account_type !== oldRegistration.account_type ){
                    if( req.params.registration.account_type === 'personal' || req.params.registration.account_type === 'business' ){
                        update[ '$set' ][ 'account_type' ] = req.params.registration.account_type;
                        if( oldRegistration.track_changes && oldRegistration.account_type !== req.params.registration.account_type ){
                            changes.push( {
                                path: 'account_type',
                                oldValue: oldRegistration.account_type,
                                newValue: req.params.registration.account_type
                            } );
                        }
                    }
                }

                _.forEach( keys, function( index ){
                    if( _.has( req.params.registration, index ) ){
                        _.forEach( req.params.registration[ index ], function( newItem, key ){
                            var oldItem = oldRegistration[ index ][ key ];
                            var path = index + '.' + key;

                            // Handle dates differently for comparisons
                            if( _.isDate( oldItem ) && moment( newItem ).isValid() ){
                                var newDate = moment( newItem );
                                var oldDate = moment( oldItem );

                                if( newDate.diff( oldDate ) !== 0 ){
                                    update[ '$set' ][ path ] = newItem;

                                    if( oldRegistration.track_changes ){
                                        changes.push( {
                                            path: path,
                                            oldValue: oldItem,
                                            newValue: newItem
                                        } );
                                    }
                                }
                            }
                            else if( oldItem !== newItem ){
                                update[ '$set' ][ path ] = newItem;

                                if( oldRegistration.track_changes ){
                                    changes.push( {
                                        path: path,
                                        oldValue: oldItem,
                                        newValue: newItem
                                    } );
                                }
                            }
                        } );
                    }
                } );
                //if changes are made are pushed to update
                if( oldRegistration.track_changes && changes.length > 0 ){
                    update[ '$pushAll' ] = { changes: changes };
                }

                //if registration successful, logs it and sends 200.
                Registration.update( { _id: oldRegistration._id }, update, function( err, numberAffected ){
                    if( err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else{
                        logger.info( 'registration', 'updated [' + oldRegistration._id + ']', {
                            req: req,
                            model: 'registration',
                            model_id: oldRegistration._id
                        } );

                        res.send( 200, {} );
                        return next();
                    }
                } );
            }
        } );
    }
};

/**
 * @method complete
 * @description Changes the status of a registration to 1 (complete) and
 * sends verification email
 *
 * @param {object} req The request
 * @param {object} res The response
 * @param {function} next Calls the next function
 *
 * @return {Function} next
 */

/**
 * @api {put} /registrations/:registration_id/complete Complete Registration
 * @apiGroup Registrations
 * @apiName RegistrationsComplete
 * @apiVersion 1.0.0
 *
 * @apiDescription Complete the registration.
 *
 * @apiParam {String} registration_id ID of the the current registration session
 *
 * @apiSuccess (200) {Object} - Empty object
 * @apiError (400) {String[]} errors List of error messages
 * @apiError (500) {String[]} errors List of error messages
 *
 */

exports.complete = function( req, res, next ){

    req.assert( 'registration_id', 'isString' );
    if( _.isEmpty( req.validationErrors ) ){

        // Find email
        Registration.findOne( {
                $and: [
                    { _id: mongoose.Types.ObjectId( req.params.registration_id ) },
                    { user_id: mongoose.Types.ObjectId( req.authInfo._id ) },
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
                            'Registration not found'
                        ]
                    } );

                    logger.info( 'registration', 'Cannot find registration [' + req.params.registration_id + ']', {
                        req: req
                    } );

                    return next();
                }
                else if( registration.status !== 0 ){
                    res.send( 400, {
                        errors: [
                            'Registration already completed'
                        ]
                    } );

                    logger.info( 'registration', 'registration already completed [' + req.params.registration_id + ']', {
                        req: req
                    } );

                    return next();
                }
                else if( _.isEmpty( registration.user.email ) ){
                    logger.error( 'registration', 'Email missing [' + registration._id + ']', {
                        req: req
                    } );

                    res.send( 400, {
                        errors: [
                            'Registration missing user email'
                        ]
                    } );
                    return next();
                }
                else{
                    Registration.update( { _id: registration._id }, {
                            $set: { status: 1 }
                        },
                        {}, function( err, numberAffected ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else if( numberAffected === 0 ){
                                logger.info( 'registration', 'Registration not updated [' + registration._id + ']', {
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

                                var newVerification = new Verification( {
                                    to: registration.user.email,
                                    user_id: req.authInfo._id,
                                    type: 0
                                } );

                                newVerification.save( function( err ){
                                    if( err ){
                                        _this.handleError( err, req, res );
                                        return next();
                                    }
                                    else{

                                        var adminCompleteData = {};
                                        if( registration.account_type === 'business' ){
                                            adminCompleteData[ 'company_name' ] = registration.company.name;
                                            adminCompleteData[ 'user_name' ] = registration.user.first_name + ' ' + registration.user.last_name;
                                        }
                                        else{
                                            adminCompleteData[ 'company_name' ] = registration.user.first_name + ' ' + registration.user.last_name;
                                            adminCompleteData[ 'user_name' ] = ' ';
                                        }

                                        notifier.sendEmail( 'reg-admin-complete', 'support@xirik.com', adminCompleteData, function( err, result ){
                                            if( err ){
                                                logger.critical( err.message, { req: req } );
                                                res.send( 200, {} );
                                                return next();
                                            }
                                            else{
                                                logger.info( 'registration', 'completed [' + registration._id + ']', {
                                                    req: req,
                                                    model: 'registration',
                                                    model_id: registration._id
                                                } );
                                            }
                                        } );
                                        notifier.sendEmail( 'reg-complete', registration.user.email,
                                            {
                                                url: appConfig.host + '/email-verification?email=' + registration.user.email + '&token=' + newVerification.token
                                            }, function( err, result ){
                                                if( err ){
                                                    _this.handleError( err, req, res );
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
                        } );
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

/**
 * @method createDocument
 * @description User will first call the POST /documents api to upload the document then pass the created document info here
 * to link it to the registration.
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 *
 * @return {Function} next
 */

/**
 * @api {post} /registrations/:registration_id/documents Create Registration Document
 * @apiGroup Registrations
 * @apiName RegistrationsCreateDocument
 * @apiVersion 1.0.0
 *
 * @apiDescription Add a previously uploaded document into the registration.
 *
 * @apiParam {String} registration_id ID of the the current registration session
 * @apiParam {String} document_id ID of the the document
 * @apiParam {String} document_type Web friendly name (no spaces, not case-sensitive) of the type of document.
 * @apiParam {String} name File name of the document
 * @apiParam {String} The [MIME Media Type](http://www.iana.org/assignments/media-types/media-types.xhtml) of the uploaded document
 * @apiParam {Boolean} exemption If the document-type is exempted from being required
 * @apiParam {String} notes Notes for the document
 *
 * @apiSuccess (200) {Object} - The updated Document object
 * @apiError (400) {String[]} errors List of error messages
 *
 */
exports.createDocument = function( req, res, next ){

    var fieldValidation = [
        { valid: _.isString( req.params.registration_id ), error: { message: 'Invalid registration_id' } },
        { valid: _.isString( req.params.document_id ), error: { message: 'Invalid document_id' } },
        { valid: _.isString( req.params.document_type ), error: { message: 'Invalid document_type' } },
        { valid: _.isString( req.params.name ), error: { message: 'Invalid name' } },
        { valid: _.isString( req.params.type ), error: { message: 'Invalid type' } }
    ];

    var exemptionValidation = [
        { valid: _.isString( req.params.registration_id ), error: { message: 'Invalid registration_id' } },
        {
            valid: ( _.isBoolean( req.params.exemption ) && req.body.exemption === true ),
            error: { message: 'Invalid exemption' }
        },
        { valid: _.isString( req.params.document_type ), error: { message: 'Invalid document_type' } }
    ];

    var errors = [];
    _.forEach( fieldValidation, function( value, index, collection ){
        if( !value.valid ){
            errors.push( value.error );
        }
    } );

    var exemptionErrors = [];
    _.forEach( exemptionValidation, function( value, index, collection ){
        if( !value.valid ){
            exemptionErrors.push( value.error );
        }
    } );

    if( errors.length === 0 || exemptionErrors.length === 0 ){
        req.body._id = mongoose.Types.ObjectId();
        req.body.status = 1;
        req.body.notes = null;
        req.body.verified = false;
        req.body.verified_user_id = null;
        req.body.verified_date = null;

        Registration.update( {
            $and: [
                { _id: mongoose.Types.ObjectId( req.params.registration_id ) },
                { user_id: mongoose.Types.ObjectId( req.authInfo._id ) },
                { status: 0 }
            ]
        }, { $push: { documents: req.body } }, {}, function( err, numberAffected, raw ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( numberAffected < 1 ){
                res.send( 400, {
                    errors: [
                        'Registration not found'
                    ]
                } );
            }
            else{
                logger.info( 'registration', 'Added document:' + req.params.document_id + ' to [' + req.params.registration_id + ']', {
                    req: req,
                    model: 'registration',
                    model_id: req.params.registration_id
                } );
                res.send( 200, req.body );
                return next();
            }
        } );
    }
    else{
        if( _.isBoolean( req.params.exemption ) && req.body.exemption === true ){
            res.send( 400, { errors: exemptionErrors } );
            return next();
        }
        else{
            res.send( 400, { errors: errors } );
            return next();
        }
    }
};

/**
 * @method delete
 * @description Updates the status of a document record in the registration to 0
 * indicating the document is archived
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 *
 * @return {Function} next()
 */

/**
 * @api {del} /registrations/:registration_id/documents/:sub_document_id Delete Registration Document
 * @apiGroup Registrations
 * @apiName RegistrationRemoveDocument
 * @apiVersion 1.0.0
 *
 * @apiDescription Remove a reference to a document from the registration.
 *
 * @apiParam {String} registration_id ID of the the current registration session
 * @apiParam {String} sub_document_id The id of the linked document
 *
 * @apiSuccess (200) {Object} - Empty object
 */
exports.removeDocument = function( req, res, next ){

    req.assert( 'registration_id', 'isString' );
    req.assert( 'sub_document_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Registration.update( {
                $and: [
                    { "_id": mongoose.Types.ObjectId( req.params.registration_id ) },
                    { "documents._id": mongoose.Types.ObjectId( req.params.sub_document_id ) },
                    { "user_id": mongoose.Types.ObjectId( req.authInfo._id ) },
                    { "status": 0 }
                ]
            },
            { $set: { "documents.$.status": 0 } }, {},
            function( err, numberAffected, raw ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( numberAffected < 1 ){
                    res.send( 400, {
                        errors: [
                            'Registration not found'
                        ]
                    } );
                }
                else{
                    logger.info( 'document', 'removed document_id[' + req.params.sub_document_id + '] for registration_id[' + req.params.registration_id + ']', {
                        req: req,
                        model: 'registration',
                        model_id: req.params.registration_id
                    } );

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

/**
 * @method updateDocument
 * @description Update the document object and if has exemption, states reasons
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 *
 * @return {Function} next
 */

/**
 * @api {put} /registrations/:registration_id/documents/:sub_document_id Update document
 * @apiGroup Registrations
 * @apiName RegistrationsUpdateDocument
 * @apiVersion 1.0.0
 *
 * @apiDescription Updates the document
 *
 * @apiParam {String} registration_id ID of the the current registration session
 * @apiParam {String} sub_document_id the sub document ID
 * @apiParam {String} document_id ID of the the document
 * @apiParam {String} document_type Web friendly name (no spaces, not case-sensitive) of the type of document.
 * @apiParam {String} name File name of the document
 * @apiParam {String} The [MIME Media Type](http://www.iana.org/assignments/media-types/media-types.xhtml) of the uploaded document
 * @apiParam {Boolean} exemption If the document-type is exempted from being required
 * @apiParam {String} notes Notes for the document
 * @apiParam {Boolean} exemption If the document-type is exempted from being required
 *
 *
 * @apiSuccess (200) {Object} - The related Document object
 * @apiError (400) {String[]} errors List of error messages
 *
 */
exports.updateDocument = function( req, res, next ){

    req.assert( 'registration_id', 'isString' );
    req.assert( 'sub_document_id', 'isString' );
    req.assert( 'document_type', 'isString' );

    if( req.params.hasOwnProperty( 'exemption' ) && req.params.exemption === true ){
        req.assert( 'exemption_reason', 'isString' );
    }
    else{
        req.assert( 'document_id', 'isString' );
        req.assert( 'name', 'isString' );
        req.assert( 'type', 'isString' );
    }

    // trys to find registration
    if( _.isEmpty( req.validationErrors ) ){
        Registration.findOne( {
                $and: [
                    { "_id": mongoose.Types.ObjectId( req.params.registration_id ) },
                    { "user_id": mongoose.Types.ObjectId( req.authInfo._id ) },
                    { "status": 0 }
                ]
            },
            function( err, registration ){
                if( !!err ){
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

                    var foundDocument = false;
                    _.forEach( registration.documents, function( document, key ){
                        if( document._id.toString() === req.params.sub_document_id ){
                            //if id === to sub document id registration found
                            foundDocument = true;
                            var fields = [];
                            if( req.params.hasOwnProperty( 'exemption' ) && req.params.exemption === true ){
                                fields = [
                                    'document_type',
                                    'exemption',
                                    'exemption_reason'
                                ];
                            }
                            else{
                                fields = [
                                    'document_type',
                                    'name',
                                    'type'
                                ];
                            }
                            // for each index of fields, assigning value of field to documents
                            _.forEach( fields, function( field ){
                                if( req.params.hasOwnProperty( field ) ){
                                    registration.documents[ key ][ field ] = req.params[ field ];
                                }
                            } );
                        }
                    } );

                    if( !foundDocument ){
                        res.send( 400, {
                            errors: [
                                { sub_document_id: [ 'Document not found' ] }
                            ]
                        } );
                        return next();
                    }
                    else{
                        registration.save( function( err ){
                            if( err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else{
                                res.send( 200, req.body );
                                logger.info( 'document', 'updated document_id[' + req.params.sub_document_id + '] for registration_id[' + registration._id + ']', {
                                    req: req,
                                    model: 'registration',
                                    model_id: registration._id
                                } );
                                return next();
                            }
                        } );
                    }
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};


/**
 * @method agreement
 * @descriptions Updates user agreement object. Stores the signature, location and IP info.
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 *
 * @return {Function} next
 *
 */

/**
 * @api {put} /registrations/:registration_id/agreement Update Registration Agreement
 * @apiGroup Registrations
 * @apiName RegistrationsAgreement
 * @apiVersion 1.0.0
 *
 * @apiDescription Updates user agreement object. Stores the signature, location info.
 *
 * @apiParam {String} registration_id ID of the the current registration session
 * @apiParam {String} first_name first name
 * @apiParam {String} last_name last name
 * @apiParam {String} city the city
 * @apiParam {String} postal_code the postal code
 *
 *
 * @apiSuccess (200) {Object} - Empty object
 * @apiError (400) {String[]} errors List of error messages
 * @apiError (500) {String[]} errors List of error messages
 *
 */

exports.agreement = function( req, res, next ){
    req.assert( 'registration_id', 'isString' );
    req.assert( 'first_name', 'isString' );
    req.assert( 'last_name', 'isString' );
    req.assert( 'city', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Registration.findOne( {
                $and: [
                    { "_id": mongoose.Types.ObjectId( req.params.registration_id ) },
                    { "user_id": mongoose.Types.ObjectId( req.authInfo._id ) }
                ]
            },
            function( err, registration ){
                if( !!err ){
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
                else if( registration.status !== 0 ){
                    res.send( 400, {
                        errors: [
                            { registration_id: [ 'Registration has already been completed' ] }
                        ]
                    } );
                    return next();
                }
                else if( registration.user.first_name !== req.params.first_name || registration.user.last_name !== req.params.last_name ){
                    res.send( 400, {
                        errors: [
                            'Incorrect name'
                        ]
                    } );
                    return next();
                }
                else{

                    Agreement.findOne( {}, null, { sort: { created: 'desc' } }, function( err, agreement ){
                        if( err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else if( _.isEmpty( agreement ) ){
                            res.send( 500, { errors: [ 'An internal error has occurred' ] } );
                            return next();
                        }
                        else{
                            registration.userAgreement = {
                                city: req.params.city,
                                postal_code: req.params.postal_code,
                                agreed_on: moment.utc().format(),
                                agreement_id: agreement._id
                            };

                            if( _.isObject( req.headers ) && _.isString( req.headers[ 'x-real-ip' ] ) ){
                                registration.userAgreement.ip = req.headers[ 'x-real-ip' ];
                            }
                            else if( _.isObject( req.connection ) && _.isString( req.connection.remoteAddress ) ){
                                registration.userAgreement.ip = req.connection.remoteAddress;
                            }

                            registration.save( function( err ){
                                if( err ){
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else{
                                    logger.info( 'registration', registration.user.first_name + ' ' + registration.user.last_name + 'signed the agreement for registration [' + registration._id + ']', {
                                        req: req,
                                        model: 'registration',
                                        model_id: registration._id
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
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

/**
 * @method inquiries
 * @descriptions if user information is valid updates each inquiry question with input from user
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 *
 * @return {Function} next
 */

/**
 * @api {put} /registrations/:registration_id/agreement Update Registration Inquiries
 * @apiGroup Registrations
 * @apiName RegistrationsInquiries
 * @apiVersion 1.0.0
 *
 * @apiParam {String} registration_id ID of the the current registration session
 * @apiParam {Object[]}  inquiries List of compliance questions and answers
 * @apiParam {String} inquiries._id Id of the inquiry object
 * @apiParam {String} inquiries.account_type Business or personal
 * @apiParam {String} inquiries.answer Answer to inquiry, yes|no
 * @apiParam {String} inquiries.help_text Additional information about the inquiry
 * @apiParam {String} inquiries.question The inquiry question
 * @apiParam {Boolean} inquiries.required If question is required to be answered
 * @apiParam {Number} inquiries.type Input type of the question
 * - 0:Text
 * - 1: Binary (yes/no)
 *
 * @apiDescription updates inquiry input from user for the registration.
 *
 * @apiSuccess (200) {Object} registration The updated Registration object
 * @apiError (400) {String[]} errors List of error messages
 *
 */
exports.inquiries = function( req, res, next ){
    req.assert( 'registration_id', 'isString' );
    req.assert( 'inquiries', 'isArray' );

    if( _.isEmpty( req.validationErrors ) ){
        Registration.findOne( {
                $and: [
                    { "_id": mongoose.Types.ObjectId( req.params.registration_id ) },
                    { "user_id": mongoose.Types.ObjectId( req.authInfo._id ) }
                ]
            },
            function( err, registration ){
                if( !!err ){
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
                else if( registration.status !== 0 ){
                    res.send( 400, {
                        errors: [
                            { registration_id: [ 'Registration has already been completed' ] }
                        ]
                    } );
                    return next();
                }
                else{
                    var update = { $set: {} };
                    var changes = [];
                    //for each inquiry question compared against user input
                    _.forEach( req.params.inquiries, function( paramItem ){
                        _.forEach( registration.inquiries, function( inquiry, inquiryKey ){
                            if( inquiry.question === paramItem.question && _.isString( paramItem.question ) && !_.isEmpty( paramItem.answer ) ){

                                if( registration.track_changes && inquiry.answer !== paramItem.answer ){
                                    changes.push( {
                                        path: 'inquiries.' + inquiryKey + '.answer',
                                        oldValue: inquiry.answer,
                                        newValue: paramItem.answer
                                    } );
                                }

                                registration.inquiries[ inquiryKey ].answer = paramItem.answer;
                            }
                        } );
                    } );

                    if( registration.track_changes ){
                        update[ '$pushAll' ] = { changes: changes };
                    }

                    update[ '$set' ][ 'inquiries' ] = registration.inquiries;

                    Registration.update( { _id: registration._id }, update, function( err, numberAffected, raw ){
                        if( err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else if( numberAffected === 0 ){
                            logger.info( 'registration', 'Error finding registration', {
                                req: req
                            } );

                            res.send( 400, { errors: [ 'An internal error has occurred' ] } );
                            return next();
                        }
                        else{
                            logger.info( 'registration', 'updated inquiries [' + registration._id + ']', {
                                req: req,
                                model: 'registration',
                                model_id: registration._id
                            } );

                            var returnData = registration.toObject();
                            delete returnData.userAgreement;
                            delete returnData.risk;
                            delete returnData.changes;
                            delete returnData.track_changes;

                            res.send( 200, { registration: returnData } );
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
/**
 * @method appStep
 * @descriptions Update the appSteps status
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 *
 * @return {Function} next
 */

/**
 * @api {put} /registrations/:registration_id/appSteps Update Registration Steps
 * @apiGroup Registrations
 * @apiName RegistrationsAppSteps
 * @apiVersion 1.0.0
 *
 *
 * @apiDescription Update Registration Steps
 *
 * @apiParam {String} registration_id ID of the the current registration session
 * @apiParam {Object[]} appSteps List of steps
 * @apiParam {String} appSteps._id ID of the the current registration session
 * @apiParam {Boolean} appSteps.active True or false
 * @apiParam {String} appSteps.icon Icon for current step
 * @apiParam {String} appSteps.name Name for the step
 * @apiParam {Number} appSteps.order The order number of the step that is displayed on the sidebar
 * @apiParam {String} appSteps.route URI info for the route icon
 * @apiParam {Number} appSteps.status Flag to indicate if the step has been completed
 *
 * @apiError (400) {String[]} errors List of error messages
 * @apiSuccess (200) {Object} - Empty object
 *
 */
exports.appSteps = function( req, res, next ){
    req.assert( 'registration_id', 'isString' );
    req.assert( 'appSteps', 'isArray' );

    if( !_.isEmpty( req.validationErrors ) ){
        util.handleValidationErrors( req, res );
        return next();
    }
    else{
        Registration.findOne( {
                $and: [
                    { "_id": mongoose.Types.ObjectId( req.params.registration_id ) },
                    { "user_id": mongoose.Types.ObjectId( req.authInfo._id ) }
                ]
            },
            function( err, registration ){
                if( !!err ){
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
                else if( registration.status !== 0 ){
                    res.send( 400, {
                        errors: [
                            { registration_id: [ 'Registration has already been completed' ] }
                        ]
                    } );
                    return next();
                }
                else{
                    var update = { "$set": {} };

                    _.forEach( req.params.appSteps, function( paramItem ){
                        _.forEach( registration.appSteps, function( appStep, appStepKey ){
                            if( paramItem.route === appStep.route ){
                                if( _.isNumber( paramItem.status ) ){
                                    registration.appSteps[ appStepKey ].status = paramItem.status;
                                }
                                return false;
                            }
                        } );
                    } );

                    var trackChanges = true;
                    _.forEach( registration.appSteps, function( step, key ){
                        if( step.route !== 'complete' && step.status === 0 ){
                            trackChanges = false;
                        }
                    } );

                    if( trackChanges ){
                        update.$set.track_changes = true;
                    }

                    update.$set[ 'appSteps' ] = registration.appSteps;

                    Registration.update( { _id: registration._id },
                        update,
                        function( err, numberAffected, raw ){
                            if( err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else if( numberAffected === 0 ){
                                logger.info( 'registration', 'Error finding registration', {
                                    req: req
                                } );

                                res.send( 400, { errors: [ 'An internal error has occurred' ] } );
                                return next();
                            }
                            else{
                                logger.info( 'registration', 'updated inquiries [' + registration._id + ']', {
                                    req: req,
                                    model: 'registration',
                                    model_id: registration._id
                                } );

                                var returnData = registration.toObject();
                                delete returnData.userAgreement;
                                delete returnData.risk;
                                delete returnData.changes;
                                delete returnData.track_changes;

                                res.send( 200, {} );
                                return next();
                            }
                        } );
                }
            } );
    }
};
