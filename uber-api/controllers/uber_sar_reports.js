

var Sequelize = require( 'sequelize' );
var db = require( '../models' );
var uberDb = require( '../models_uber' );
var _ = require( 'lodash' );
var kebabCase = require( 'lodash.kebabcase' );
var camelCase = require( 'lodash.camelcase' );
var Promise = require( 'promise' );
var request = require( 'request' );
var pdfConfig = require( '../config/config.json' ).pdf_api;
var config = require( '../config/config.json' );
var moment = require( 'moment-timezone' );

var Archiver = require( 'archiver' );


var UberSARReport = uberDb.UberSARReport;
var UberSARReportRelation = uberDb.UberSARReportRelation;
var UberSARSubmission = uberDb.UberSARSubmission;
var UberTask = uberDb.UberTask;

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var notifier = require( '../lib/akx.notifier.js' );
var _this = this;

var Hashids = require( "hashids" );
var hashidConfig = require( '../config/config.json' ).secrets.hashId;
var hashids = new Hashids( hashidConfig, 11, "LP4D7XBFO8A2NZYK5EUIR6MVH3WQJGS10TC9" );


exports.handleError = function( err, req, res ){
    util.handleError( 'uber_sar_report', err, req, res );
};


exports.index = function( req, res, next ){
    var query = {
        where: {},
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

    UberSARReport.findAndCountAll( query )
        .then( function( uberSARReports ){


            var totalPages = 1;
            if( paged ){
                var pageRatio = uberSARReports.count / req.params.per_page;
                totalPages = Math.floor( pageRatio );
                if( pageRatio % 1 > 0 ){
                    totalPages++;
                }
            }

            res.send( 200, { uberSarReport: uberSARReports.rows, meta: { total_pages: totalPages } } );
            return next();

        } ).catch( function( err ){
        _this.handleError( err, req, res );
        return next();
    } )

};

exports.view = function( req, res, next ){
    req.assert( 'uber_sar_report_id', 'isString' );

    var whereCond = [
        { id: req.params.uber_sar_report_id }
    ];


    if( _.isEmpty( req.validationErrors ) ){
        UberSARReport.find( {
            where: whereCond
        } )
            .then( function( uberSarReport ){
                res.send( 200, { uberSarReport: uberSarReport } );
                return next();
            } )
            .catch( function( err ){
                _this.handleError( err, req, res );
                return next();
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

function updateReportRelations( uberSARReport, raw_data, req ){

    var promises = [];

    _.forEach( raw_data.transactions, function( trans ){
        promises.push( UberTask.create( {
            model: trans.type,
            model_id: trans.id,
            type: 1,
            title: 'SAR Report',
            notes: 'SAR Report on transaction. Please reference report SAR-' + uberSARReport.name,
            uber_user_id: req.user.id
        } ) )
    } );

    _.forEach( raw_data.activities, function( activity ){
        _.forEach( activity.subjects, function( subject ){
            subject = raw_data[ subject.array ][ subject.index ];
            promises.push( new Promise( function( resolve, reject ){
                if( subject.company ){
                    UberSARReportRelation.findAll( {
                        where: {
                            company_id: subject.company.id,
                            uber_sar_report_id: uberSARReport.id
                        }
                    } )
                        .then( function( reportRelations ) {

                            if( _.isEmpty( reportRelations ) ){
                                UberSARReportRelation.create( { company_id: subject.company.id, uber_sar_report_id: uberSARReport.id } )
                                    .then( function(){
                                        return resolve();
                                    } )
                                    .catch( function( err ){
                                        return reject( err );
                                    } );
                            }
                            return resolve();
                        } )
                        .catch( function( err ){
                            return reject( err );
                        } );
                }
                return resolve();
            } ) );
        } );
    } );

    return Promise.all( promises );
}

function ordinal_suffix_of( i ) {
    var j = i % 10,
        k = i % 100;
    if ( j == 1 && k != 11 ) {
        return i + "st";
    }
    if ( j == 2 && k != 12 ) {
        return i + "nd";
    }
    if ( j == 3 && k != 13 ) {
        return i + "rd";
    }
    return i + "th";
}

exports.create = function( req, res, next ){

    req.assert( 'uberSarReport', 'isObject' );

    if( _.isEmpty( req.validationErrors ) ){

        req.params.uberSarReport.status = 0;

        req.params.uberSarReport.uber_user_id = req.user.id;

        var raw_data = JSON.parse( req.params.uberSarReport.raw_data );

        req.params.uberSarReport.name = hashids.encode( new Date().getTime() );

        UberSARReport.create( req.params.uberSarReport )
            .then( function( uberSARReport ){
                updateReportRelations( uberSARReport, raw_data, req ).then( function(){

                    res.send( 201, { uber_sar_report: uberSARReport } );
                    return next();
                } )
                    .catch( function( err ){

                        _this.handleError( err, req, res );
                        return next();
                    } );
            } )
                .catch( function( err ){

                    _this.handleError( err, req, res );
                    return next();
                } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.update = function( req, res, next ){

    req.assert( 'uberSarReport', 'isObject' );
    req.assert( 'uber_sar_report_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        UberSARReport.find( {
            where: [
                { id: req.params.uber_sar_report_id }
            ]
        } )
            .then( function( uberSarReport ){
                if( _.isEmpty( uberSarReport ) ){
                    res.send( 400, {
                        errors: [
                            'Cannot find report'
                        ]
                    } );
                    return next();
                }

                if( uberSarReport.status !== 0 ){
                    res.send( 400, {
                        errors: [
                            'Cannot update sent report'
                        ]
                    } );
                    return next();
                }
                else {

                    var raw_data = JSON.parse( req.params.uberSarReport.raw_data );

                    if( req.params.uberSarReport.status !== 1 ){

                        uberSarReport.save()
                            .then( function( updatedUberSarReport ) {
                                updateReportRelations( updatedUberSarReport, raw_data, req ).then( function(){

                                    res.send( 201, { uber_sar_report: updatedUberSarReport } );
                                    return next();
                                } )
                                    .catch( function( err ){

                                        _this.handleError( err, req, res );
                                        return next();
                                    } );
                            } )
                                .catch( function( err ){

                                    _this.handleError( err, req, res );
                                    return next();
                                } );
                    }
                    else if( req.params.uberSarReport.status === 1 ) {

                        var validiationFields = [
                            { field: 'uber_user_id', validation: _.isString },
                            { field: 'status', validation: _.isNumber },
                            { field: 'raw_data', validation: _.isString },
                            { field: 'notes', validation: _.isString }
                        ];

                        _.forEach( validiationFields, function( item ){
                            if( item.validation( req.params.uberSarReport[ item.field ] ) ){
                                uberSarReport[ item.field ] = req.params.uberSarReport[ item.field ];
                            }
                        } );

                        var errors = [];

                        if( _.isEmpty( raw_data.activities ) ){
                            errors.push( { msg: 'The SAR does not have any activities. An SAR must have at least one activity.' } );
                        }
                        else{
                            var i = 1;
                            _.forEach( raw_data.activities, function( activity ){

                                if( _.isEmpty( activity.dateFrom ) ){
                                    errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity on the SAR is missing a from date. Each activity must have a from date.' } );
                                }
                                else if( !_.isString( activity.dateFrom ) ){
                                    errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity on the SAR has a from date that is not a string. Each activity must have a from date that is a string.' } );
                                }
                                else if( !moment( activity.dateFrom ).isValid() ){
                                    errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity on the SAR has a from date that is not a valid date. Each activity must have a from date that is a valid date.' } );
                                }
                                else if( moment( activity.dateFrom ).isAfter( moment() ) ){
                                    errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity on the SAR has a from date that is after today&#39;s date. Each activity must have a from date that is on or before today&#39;s date.' } );
                                }

                                if( !_.isEmpty( activity.dateTo ) ){
                                    if( !_.isString( activity.dateTo ) ){
                                        errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity on the SAR has a to date that is not a string. Each activity&#39;s to date must be a string if a to date is provided.' } );
                                    }
                                    else if( !moment( activity.dateTo ).isValid() ){
                                        errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity on the SAR has a to date that is not a valid date. Each activity&#39;s to date must be a valid date if a to date is provided.' } );
                                    }
                                    else if( moment( activity.dateTo ).isAfter( moment() ) ){
                                        errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity on the SAR has a to date that is after today&#39;s date. Each activity&#39;s to date must be on or before today&#39;s date if a to date is provided.' } );
                                    }
                                    else if( moment( activity.dateTo ).isBefore( moment( activity.dateFrom ) ) ){
                                        errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity on the SAR has a to date that is before the from date. Each activity&#39;s to date must be on or after the from date if a to date is provided.' } );
                                    }
                                }

                                //Check classification
                                if( _.isEmpty( activity.activityType ) ){
                                    errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity on the SAR is missing an activity type. Each activity must have an activity type.' } );
                                }

                                if( _.isEmpty( activity.activitySubtype ) ){
                                    errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity on the SAR is missing an activity subtype. Each activity must have an activity subtype.' } );
                                }

                                if( activity.activitySubtype == '999' ){
                                    if( _.isEmpty( activity.subtypeDescription ) ){
                                        errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity on the SAR has the activity subtype "Other" but does not have a subtype description. Each activity that has the subtype "Other" must have a subtype description.' } );
                                    }
                                    else if( activity.subtypeDescription.length > 50 ){
                                        errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity on the SAR has a subtype description that is greater than 50 characters. Each activity that has the subtype "Other" must have a subtype description that is 50 characters or less.' } );
                                    }
                                }

                                if( _.isEmpty( activity.narrative ) ){
                                    errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity on the SAR is missing a narrative. Each activity must have a narrative.' } );
                                }
                                else{
                                    if( activity.narrative.length > 17000 ){
                                        errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity on the SAR has a narrative that is too long. Each activity&#39;s narrative must be under 17,000 characters.' } );
                                    }
                                }

                                if( _.isEmpty( activity.subjects ) ){
                                    errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity on the SAR does not have any subjects. Each activity must have at least one subject.' } );
                                }
                                else{
                                    var j = 1;
                                    _.forEach( activity.subjects, function( subject ){

                                        if( _.isEmpty( subject.array ) ){
                                            errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity&#39;s ' + ordinal_suffix_of( j ) + ' subject on the SAR does not have an "array" field. Each activity&#39;s subject must have an "array" field that corresponds to an array in the raw_data.' } );
                                        }
                                        else if( !_.isString( subject.array ) ) {
                                            errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity&#39;s ' + ordinal_suffix_of( j ) + ' subject on the SAR has an "array" field that is not a string and therefore could never correspond to an array in raw_data. Each activity&#39;s subject must have an "array" field that corresponds to an array in the raw_data.' } );
                                        }
                                        else if( !_.isArray( raw_data[ subject.array ] ) ) {
                                            errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity&#39;s ' + ordinal_suffix_of( j ) + ' subject on the SAR has an "array" field that does not correspond to an array in raw_data. Each activity&#39;s subject must have an "array" field that corresponds to an array in the raw_data.' } );
                                        }
                                        else if( _.isUndefined( subject.index ) || _.isNull( subject.index ) ){
                                            errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity&#39;s ' + ordinal_suffix_of( j ) + ' subject on the SAR does not have an "index" field. Each activity&#39;s subject must have an "index" field that corresponds to an index in the array on the raw_data referenced by the subjects "array" field.' } );
                                        }
                                        else if( !_.isNumber( subject.index ) ) {
                                            errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity&#39;s ' + ordinal_suffix_of( j ) + ' subject on the SAR has an "index" field that is not a number and therefore could never correspond to an index in the array on the raw_data referenced by the subjects "array" field Each activity&#39;s subject must have an "index" field that corresponds to an index in the array on the raw_data referenced by the subjects "array" field.' } );
                                        }
                                        else if( !_.isObject( raw_data[ subject.array ][ subject.index ] ) ) {
                                            errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity&#39;s ' + ordinal_suffix_of( j ) + ' subject on the SAR has an "index" field that does not correspond to an index in the array on the raw_data referenced by the subjects "array" field Each activity&#39;s subject must have an "index" field that corresponds to an index in the array on the raw_data referenced by the subjects "array" field.' } );
                                        }
                                        else{
                                            subject = raw_data[ subject.array ][ subject.index ];
                                            if( _.isEmpty( subject.account_type ) ){
                                                errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity&#39;s ' + ordinal_suffix_of( j ) + ' subject on the SAR does not have an account type. Each activity&#39;s subject must have an account type.' } );
                                            }
                                            else if( subject.account_type !== 'personal' && subject.account_type !== 'business' ){
                                                errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity&#39;s ' + ordinal_suffix_of( j ) + ' subject on the SAR has an account type that is not set to either "personal" or "business". Each activity&#39;s subject must have an account type and that account type must be set to either "personal" or "business".' } );
                                            }
                                            else if( !_.isEmpty( subject.subject_role ) && subject.subject_role !== 'A' && subject.subject_role !== 'B' && subject.subject_role !== 'C' ){
                                                errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity&#39;s ' + ordinal_suffix_of( j ) + ' subject on the SAR has a subject role that is not set to either "A", "B" or "C". Each activity&#39;s subject&#39;s subject role must be set to either "A", "B" or "C" if the subject role is provided.' } );
                                            }
                                            else{
                                                if( subject.account_type === 'personal' ){
                                                    if( !_.isEmpty( subject.first_name ) && !_.isString( subject.first_name ) ){
                                                        errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity&#39;s ' + ordinal_suffix_of( j ) + ' subject on the SAR has a first name that is not a string. Each activity&#39;s subject&#39;s first name must be a string if the first name is provided.' } );
                                                    }
                                                    if( !_.isEmpty( subject.last_name ) && !_.isString( subject.last_name ) ){
                                                        errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity&#39;s ' + ordinal_suffix_of( j ) + ' subject on the SAR has a last name that is not a string. Each activity&#39;s subject&#39;s last name must be a string if the last name is provided.' } );
                                                    }
                                                    if( !_.isEmpty( subject.nationality ) && !_.isString( subject.nationality ) ){
                                                        errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity&#39;s ' + ordinal_suffix_of( j ) + ' subject on the SAR has a nationality that is not a string. Each activity&#39;s subject&#39;s nationality must be a string if the nationality is provided.' } );
                                                    }
                                                    if( !_.isEmpty( subject.date_of_birth ) ){
                                                        if( !_.isString( subject.date_of_birth ) ){
                                                            errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity&#39;s ' + ordinal_suffix_of( j ) + ' subject on the SAR has a date of birth that is not a string. Each activity&#39;s subject&#39;s date of birth must be a string if the date of birth is provided.' } );
                                                        }
                                                        else if( !moment( subject.date_of_birth ).isValid() ){
                                                            errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity&#39;s ' + ordinal_suffix_of( j ) + ' subject on the SAR has a date of birth that is not a valid date. Each activity&#39;s subject&#39;s date of birth must be a valid date if the date of birth is provided.' } );
                                                        }
                                                    }
                                                }
                                                if( subject.account_type === 'business' ){
                                                    if( !_.isEmpty( subject.name ) && !_.isString( subject.name ) ){
                                                        errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity&#39;s ' + ordinal_suffix_of( j ) + ' subject on the SAR has a name that is not a string. Each activity&#39;s subject&#39;s name must be a string if the name is provided.' } );
                                                    }
                                                }
                                            }

                                            if( !_.isEmpty( subject.phone ) ){
                                            	subject.phone = subject.phone.replace(/\D/g,''); //Strip all but numbers
                                                if( !( /^\d+$/.test( subject.phone ) ) ){
                                                    errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity&#39;s ' + ordinal_suffix_of( j ) + ' subject on the SAR has a phone number that is not a number. Each activity&#39;s subject&#39;s phone number must be numbers only if the phone number is provided.' } );
                                                }
                                                else if( subject.phone.length > 16 ){
                                                    errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity&#39;s ' + ordinal_suffix_of( j ) + ' subject on the SAR has a phone number that is greater than 16 characters. Each activity&#39;s subject&#39;s phone number must be 16 characters or less if the phone number is provided.' } );
                                                }
                                            }

                                            if( !_.isEmpty( subject.email ) ){
                                                if( !_.isString( subject.email ) ){
                                                    errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity&#39;s ' + ordinal_suffix_of( j ) + ' subject on the SAR has a email that is not a string. Each activity&#39;s subject&#39;s email must be a string if the email is provided.' } );
                                                }
                                                else if( !util.isEmail( subject.email ) ){
                                                    errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity&#39;s ' + ordinal_suffix_of( j ) + ' subject on the SAR has a email that is not a valid email. Each activity&#39;s subject&#39;s email must be a valid email if the email is provided.' } );
                                                }
                                                else if( subject.email.length > 517 ){
                                                    errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity&#39;s ' + ordinal_suffix_of( j ) + ' subject on the SAR has a email that is greater than 517 characters. Each activity&#39;s subject&#39;s email must be 517 characters or less if the email is provided.' } );
                                                }
                                            }

                                            if( !_.isEmpty( subject.address ) ){
                                                if( !_.isString( subject.address ) ){
                                                    errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity&#39;s ' + ordinal_suffix_of( j ) + ' subject on the SAR has an address that is not a string. Each activity&#39;s subject&#39;s address must be a string if the address is provided.' } );
                                                }
                                                else if( subject.address.length > 100 ){
                                                    errors.push( { msg: 'The ' + ordinal_suffix_of( i ) + ' activity&#39;s ' + ordinal_suffix_of( j ) + ' subject on the SAR has an address that is greater than 100 characters. Each activity&#39;s subject&#39;s address must be 100 characters or less if the address is provided.' } );
                                                }
                                            }
                                        }
                                        j++;
                                    } );
                                }
                                i++;
                            } );
                        }
                        if( !_.isEmpty( errors ) ) {
                            uberSarReport.status = 0;
                        }
                        uberSarReport.save()
                            .then( function( updatedUberSarReport ){
                                updateReportRelations( updatedUberSarReport, raw_data, req ).then( function(){

                                    if( _.isEmpty( errors ) ) {
                                        res.send( 201, { uber_sar_report: updatedUberSarReport } );
                                        return next();
                                    }

                                    else{
                                        res.send( 400, { errors: errors } );
                                        return next();
                                    }

                                } )
                                    .catch( function( err ){

                                        _this.handleError( err, req, res );
                                        return next();
                                    } );
                            } )
                            .catch( function( err ){
                                _this.handleError( err, req, res );
                                return next();
                            } );
                    }
                    else{
                        res.send( 400, {
                            errors: [
                                'Report status must be set to 1 or 0'
                            ]
                        } );
                        return next();
                    }
                }

            } )
            .catch( function( err ){
                _this.handleError( err, req, res );
                return next();
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.downloadFinCEN = function( req, res, next ){
    req.assert( 'uber_sar_report_id', 'isString' );
    req.assert( 'file_type', 'isString' );

    var whereCond = [
        { id: req.params.uber_sar_report_id }
    ];

    if( _.isEmpty( req.validationErrors ) ){
        UberSARReport.find( {
            where: whereCond
        } )
            .then( function( uberSarReport ){

                UberSARReport.generateSARReport( uberSarReport, req.params.file_type )
                    .then( function( output ){
                        var prefix = "SARST";
                        var fileType;
                        var contentType;
                        switch( req.params.file_type ){
                            case 'ascii':
                            	fileType = 'akx'
                                contentType = 'text/plain';
                                break;
                            case 'xml':
                            	fileType = 'xml';
                                contentType = 'application/xml';
                                break;
                            default:
                        }
                        res.setHeader( 'Content-disposition', 'attachment; filename=' + fileType + moment.utc().format( 'YYYYMMDDHHmmss' ) + '.' + fileType );
                        res.setHeader( 'Content-type', contentType );
                        res.send( 200, output );
                        return next();
                    } )
                    	.catch( function( err ){
                    		_this.handleError( err, req, res );
                            return next();
                    	} );
            } )
            .catch( function( err ){
                _this.handleError( err, req, res );
                return next();
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.downloadgoAML = function( req, res, next ){
    req.assert( 'uber_sar_report_id', 'isString' );

    var whereCond = [
        { id: req.params.uber_sar_report_id }
    ];

    if( _.isEmpty( req.validationErrors ) ){
        UberSARReport.find( {
            where: whereCond
        } )
            .then( function( uberSarReport ){

                var goAMLReport = UberSARReport.generategoAMLReport( uberSarReport );
                var fileName = "SARST" + moment.utc().format( 'YYYYMMDDHHmmss' );

                if( goAMLReport.length > 1 ){

                    res.setHeader( 'Content-disposition', 'attachment; filename=' + fileName + '.zip' );
                    res.setHeader( 'Content-type', 'application/zip' );

                    var zip = Archiver( 'zip' );

                    zip.on( 'end', function() {
                        return next();
                    } );

                    zip.pipe( res );

                    _.forEach( goAMLReport, function( report, index ){
                        zip.append( report , { name: fileName + '-' + ( index + 1 ) + '.xml' } );
                    } );

                    zip.finalize();
                }

                else if( goAMLReport.length == 1 ){

                    res.setHeader( 'Content-disposition', 'attachment; filename=' + fileName + '.xml' );
                    res.setHeader( 'Content-type', 'application/xml' );
                    res.send( 200, goAMLReport[ 0 ] );

                    return next();
                }

                else throw new Error( 'No reports were generated by the UberSARReport model!' );
            } )
            .catch( function( err ){
                _this.handleError( err, req, res );
                return next();
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};


exports.pdf = function( req, res, next ){
    req.assert( 'uber_sar_report_id', 'isString' );

    if( !_.isEmpty( req.validationErrors ) ){
        util.handleValidationErrors( req, res );
        return next();
    }
    else{
        UberSARReport.find( {
            where: {
                id: req.params.uber_sar_report_id
            },
            include: [
                {
                    model: UberSARSubmission
                }
            ]
        } ).then( function( uberSarReport ){
            if( !uberSarReport ){
                res.send( 404 );
                return next();
            }
            else{

                var data = JSON.parse( uberSarReport.raw_data );

                data.internal_control_number = "SAR-" + uberSarReport.name;

                //Find the report submission with the most recent created_at date where type==0 (fincen) && status==1 (sent)
                data.submission_date = _.max( _.filter( uberSarReport.uberSarSubmissions, { type: 0, status: 2 } ), function( o ){
                    return moment( o.created_at ).valueOf();
                } ).created_at;
                data.has_submission_date = typeof data.submission_date != 'undefined';
                if( data.has_submission_date ){
                    data.submission_date = moment( data.submission_date ).format( 'YYYY-MM-DD' );
                }

                data.institution = config.sar_submission;

                if( data.institution.type_of_institution === "99" || data.institution.type_of_institution === "Z" ){
                    data.institution.type_of_institution = "Other";
                }

                if( data.institution.federal_regulator === "99" || data.institution.federal_regulator === "Z" ){
                    data.institution.federal_regulator = "Not Applicable";
                }

                _.forEach( data.transactions, function( transaction ){
                    if( transaction.type === "Wire" ){
                        transaction.isWire = true;
                    }
                    else if( transaction.type === "FxRequest" ){
                        transaction.isFX = true;
                    }
                } );

                _.forEach( data.activities, function( activity, activityIndex ){

                    activity.filing_type = "Initial Report";

                    activity.subheading = "ACTIVITY " + ( activityIndex + 1 ) + " OF " + data.activities.length;

                    if( activity.activityType === 'structuring' ){
                        activity.activityType = 'Structuring';
                        if( activity.activitySubtype === "11" ){
                            activity.activitySubtype = "Alters or cancels transaction to avoid BSA recordkeeping requirement";
                        }
                        if( activity.activitySubtype === "12" ){
                            activity.activitySubtype = "Alters or cancels transaction to avoid CTR requirement";
                        }
                        if( activity.activitySubtype === "06" ){
                            activity.activitySubtype = "Suspicious inquiry by customer regarding BSA reporting or recordkeeping requirements";
                        }
                        if( activity.activitySubtype === "13" ){
                            activity.activitySubtype = "Transaction(s) below BSA recordkeeping threshold";
                        }
                        if( activity.activitySubtype === "14" ){
                            activity.activitySubtype = "Transaction(s) below CTR threshold";
                        }
                        if( activity.activitySubtype === "999" ){
                            activity.activitySubtype = 'Other';
                        }
                    }
                    if( activity.activityType === 'terroristFinancing' ){
                        activity.activityType = 'Terrorist Financing';
                        if( activity.activitySubtype === "01" ){
                            activity.activitySubtype = "Known or suspected terrorist/terrorist organization";
                        }
                        if( activity.activitySubtype === "999" ){
                            activity.activitySubtype = "Other";
                        }
                    }
                    if( activity.activityType == 'fraud' ){
                    	activity.activityType = 'Fraud';
                        if( activity.activitySubtype === "20" ){
                            activity.activitySubtype = "ACH";
                        }
                        if( activity.activitySubtype === "22" ){
                            activity.activitySubtype = "Advance fee";
                        }
                        if( activity.activitySubtype === "21" ){
                            activity.activitySubtype = "Business loan";
                        }
                        if( activity.activitySubtype === "01" ){
                            activity.activitySubtype = "Check";
                        }
                        if( activity.activitySubtype === "04" ){
                            activity.activitySubtype = "Consumer Loan";
                        }
                        if( activity.activitySubtype === "05" ){
                            activity.activitySubtype = "Credit/Debit Card";
                        }
                        if( activity.activitySubtype === "23" ){
                            activity.activitySubtype = "Healthcare/Public or private health insurance";
                        }
                        if( activity.activitySubtype === "08" ){
                            activity.activitySubtype = "Mail";
                        }
                        if( activity.activitySubtype === "09" ){
                            activity.activitySubtype = "Mass-marketing";
                        }
                        if( activity.activitySubtype === "24" ){
                            activity.activitySubtype = "Ponzi scheme";
                        }
                        if( activity.activitySubtype === "10" ){
                            activity.activitySubtype = "Pyramid scheme";
                        }
                        if( activity.activitySubtype === "25" ){
                            activity.activitySubtype = "Securities fraud";
                        }
                        if( activity.activitySubtype === "12" ){
                            activity.activitySubtype = "Wire transfer";
                        }
                        if( activity.activitySubtype === "999" ){
                            activity.activitySubtype = "Other";
                        }
                    }
                    if( activity.activityType == 'gamingActivities' ){
                        activity.activityType = 'Gaming Activities';
                        if( activity.activitySubtype === "01" ){
                            activity.activitySubtype = "Chip walking";
                        }
                        if( activity.activitySubtype === "02" ){
                            activity.activitySubtype = "Minimal gaming with large transactions";
                        }
                        if( activity.activitySubtype === "03" ){
                            activity.activitySubtype = "Suspicious use of counter checks or markers";
                        }
                        if( activity.activitySubtype === "04" ){
                            activity.activitySubtype = "Unknown source of chips";
                        }
                        if( activity.activitySubtype === "999" ){
                            activity.activitySubtype = "Other"
                        }
                    }
                    if( activity.activityType == 'moneyLaundering' ){
                        activity.activityType = 'Money Laundering';
                        if( activity.activitySubtype === "01" ){
                            activity.activitySubtype = "Exchanges small bills for large bills or vice versa";
                        }
                        if( activity.activitySubtype === "24" ){
                            activity.activitySubtype = "Funnel account";
                        }
                        if( activity.activitySubtype === "20" ){
                            activity.activitySubtype = "Suspicious concerning the physical condition of funds";
                        }
                        if( activity.activitySubtype === "21" ){
                            activity.activitySubtype = "Suspicious concerning the source of funds";
                        }
                        if( activity.activitySubtype === "04" ){
                            activity.activitySubtype = "Suspicious designation of beneficiaries, assignees or joint owners";
                        }
                        if( activity.activitySubtype === "05" ){
                            activity.activitySubtype = "Suspicious EFT/wire transfers";
                        }
                        if( activity.activitySubtype === "22" ){
                            activity.activitySubtype = "Suspicious exchange of currencies";
                        }
                        if( activity.activitySubtype === "06" ){
                            activity.activitySubtype = "Suspicious receipt of government payments/benefits";
                        }
                        if( activity.activitySubtype === "07" ){
                            activity.activitySubtype = "Suspicious use of multiple accounts";
                        }
                        if( activity.activitySubtype === "08" ){
                            activity.activitySubtype = "Suspicious use of noncash monetary instruments";
                        }
                        if( activity.activitySubtype === "09" ){
                            activity.activitySubtype = "Suspicious use of third-party transactions (straw-man)";
                        }
                        if( activity.activitySubtype === "23" ){
                            activity.activitySubtype = "Trade Based Money Laundering/Black Market Peso Exchange";
                        }
                        if( activity.activitySubtype === "12" ){
                            activity.activitySubtype = "Transaction out of pattern for customer(s)";
                        }
                        if( activity.activitySubtype === "999" ){
                            activity.activitySubtype = "Other";
                        }
                    }
                    if( activity.activityType == 'identificationDocumentation' ){
                        activity.activityType = 'Identification / Documentation';
                        if( activity.activitySubtype === "01" ){
                            activity.activitySubtype = "Changes spelling or arrangement of name";
                        }
                        if( activity.activitySubtype === "02" ){
                            activity.activitySubtype = "Multiple individuals with same or similar identities";
                        }
                        if( activity.activitySubtype === "03" ){
                            activity.activitySubtype = "Provided questionable or false documentation";
                        }
                        if( activity.activitySubtype === "09" ){
                            activity.activitySubtype = "Provided questionable or false identification";
                        }
                        if( activity.activitySubtype === "04" ){
                            activity.activitySubtype = "Refused or avoided request for documentation";
                        }
                        if( activity.activitySubtype === "05" ){
                            activity.activitySubtype = "Single individual with multiple identities";
                        }
                        if( activity.activitySubtype === "999" ){
                            activity.activitySubtype = "Other";
                        }
                    }
                    if( activity.activityType == 'otherSuspiciousActivities' ){
                        activity.activityType = 'Other suspicious activities';
                        if( activity.activitySubtype === "20" ){
                            activity.activitySubtype = "Other suspicious activities";
                        }
                        if( activity.activitySubtype === "01" ){
                            activity.activitySubtype = "Bribery or gratuity";
                        }
                        if( activity.activitySubtype === "17" ){
                            activity.activitySubtype = "Counterfeit Instrument (other)";
                        }
                        if( activity.activitySubtype === "21" ){
                            activity.activitySubtype = "Elder financial exploitation";
                        }
                        if( activity.activitySubtype === "03" ){
                            activity.activitySubtype = "Embezzlement/theft/disappearance of funds";
                        }
                        if( activity.activitySubtype === "04" ){
                            activity.activitySubtype = "Forgeries";
                        }
                        if( activity.activitySubtype === "26" ){
                            activity.activitySubtype = "Human smuggling";
                        }
                        if( activity.activitySubtype === "27" ){
                            activity.activitySubtype = "Human trafficking";
                        }
                        if( activity.activitySubtype === "05" ){
                            activity.activitySubtype = "Identity theft";
                        }
                        if( activity.activitySubtype === "22" ){
                            activity.activitySubtype = "Little or no concern for product performance penalties, fees, or tax consequences";
                        }
                        if( activity.activitySubtype === "24" ){
                            activity.activitySubtype = "Misuse of position or self-dealing";
                        }
                        if( activity.activitySubtype === "07" ){
                            activity.activitySubtype = "Suspected public/private corruption (domestic)";
                        }
                        if( activity.activitySubtype === "08" ){
                            activity.activitySubtype = "Suspected public/private corruption (foreign)";
                        }
                        if( activity.activitySubtype === "09" ){
                            activity.activitySubtype = "Suspicious use of informal value transfer system";
                        }
                        if( activity.activitySubtype === "10" ){
                            activity.activitySubtype = "Suspicious use of multiple locations";
                        }
                        if( activity.activitySubtype === "25" ){
                            activity.activitySubtype = "Transaction with no apparent economic, business, or lawful purpose";
                        }
                        if( activity.activitySubtype === "28" ){
                            activity.activitySubtype = "Transaction(s) involving foreign high risk jurisdiction";
                        }
                        if( activity.activitySubtype === "11" ){
                            activity.activitySubtype = "Two or more individuals working together";
                        }
                        if( activity.activitySubtype === "13" ){
                            activity.activitySubtype = "Unlicensed or unregistered MSB";
                        }
                        if( activity.activitySubtype === "999" ){
                            activity.activitySubtype = "Other";
                        }
                    }
                    if( activity.activityType == 'insurance' ){
                        activity.activityType = 'Insurance';
                        if( activity.activitySubtype === "01" ){
                            activity.activitySubtype = "Excessive insurance";
                        }
                        if( activity.activitySubtype === "02" ){
                            activity.activitySubtype = "Excessive or unusual cash borrowing against policy/annuity";
                        }
                        if( activity.activitySubtype === "04" ){
                            activity.activitySubtype = "Proceeds sent to unrelated third party";
                        }
                        if( activity.activitySubtype === "05" ){
                            activity.activitySubtype = "Suspicious life settlement sales insurance (e.g., STOLI's, Viaticals)";
                        }
                        if( activity.activitySubtype === "06" ){
                            activity.activitySubtype = "Suspicious termination of policy or contract";
                        }
                        if( activity.activitySubtype === "07" ){
                            activity.activitySubtype = "Unclear or no insurable interest";
                        }
                        if( activity.activitySubtype === "999" ){
                            activity.activitySubtype = "Other";
                        }
                    }
                    if( activity.activityType == 'securitiesFuturesOptions' ){
                        activity.activityType = 'Securities/Futures/Options';
                        if( activity.activitySubtype === "01" ){
                            activity.activitySubtype = "Insider trading";
                        }
                        if( activity.activitySubtype === "08" ){
                            activity.activitySubtype = "Market manipulation";
                        }
                        if( activity.activitySubtype === "03" ){
                            activity.activitySubtype = "Misappropriation";
                        }
                        if( activity.activitySubtype === "04" ){
                            activity.activitySubtype = "Unauthorized pooling";
                        }
                        if( activity.activitySubtype === "09" ){
                            activity.activitySubtype = "Wash trading";
                        }
                        if( activity.activitySubtype === "999" ){
                            activity.activitySubtype = "Other";
                        }
                    }
                    if( activity.activityType == 'mortgageFraud' ){
                        activity.activityType = 'Mortgage fraud';
                        if( activity.activitySubtype === "05" ){
                            activity.activitySubtype = "Application fraud";
                        }
                        if( activity.activitySubtype === "01" ){
                            activity.activitySubtype = "Appraisal fraud";
                        }
                        if( activity.activitySubtype === "06" ){
                            activity.activitySubtype = "Foreclosure/Short sale fraud";
                        }
                        if( activity.activitySubtype === "03" ){
                            activity.activitySubtype = "Loan Modification fraud";
                        }
                        if( activity.activitySubtype === "07" ){
                            activity.activitySubtype = "Origination fraud";
                        }
                        if( activity.activitySubtype === "999" ){
                            activity.activitySubtype = "Other";
                        }
                    }
                    if( activity.activityType == 'cyberEvent' ){
                        activity.activityType = 'Cyber event';
                        if( activity.activitySubtype === "01" ){
                            activity.activitySubtype = "Against financial institution(s)";
                        }
                        if( activity.activitySubtype === "02" ){
                            activity.activitySubtype = "Against financial institution customer(s)";
                        }
                        if( activity.activitySubtype === "999" ){
                            activity.activitySubtype = "Other";
                        }
                    }

                    _.forEach( activity.subjects, function( subject, subjectIndex ){
                        subject = data[ subject.array ][ subject.index ];
                        subject.name = _.isEmpty( subject.name ) ? subject.last_name : subject.name;
                        if( subject.id_type === "SSN/TIN" ){
                            subject.id_type = "Social Security/ TIN";
                        }
                        if( subject.id_type === "NID" ){
                            subject.id_type = "National Identification Number";
                        }
                        if( subject.id_type === "EIN" ){
                            subject.id_type = "Employee Identification Number";
                        }
                        if( subject.id_type === "PID" ){
                            subject.id_type = "Passport Identification Number";
                        }
                        if( subject.subject_role ){
                            if( subject.subject_role === "A" ){
                                subject.subject_role = "Purchaser/Sender"
                            }
                            else if( subject.subject_role === "B" ){
                                subject.subject_role = "Payee/Receiver"
                            }
                            else if( subject.subject_role === "C" ){
                                subject.subject_role = "Both Purchaser/Sender and Payee/Receiver"
                            }
                        }
                        data.activities[ activityIndex ].subjects[ subjectIndex ] = subject;
                    } );
                } );

                request.post( {
                    url: pdfConfig.host + '/pdfs',
                    json: {
                        template_name: 'uber-sar-report',
                        data: data
                    }
                }, function( err, response, pdfBody ){
                    if( err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else{
                        if( response.statusCode !== 200 && response.statusCode !== 201 ){
                            res.send( 400, { errors: [ 'Error getting pdf' ] } );
                            return next();
                        }
                        else{
                            var fileName = "SAR-" + uberSarReport.name + '.pdf';

                            res.setHeader( 'Content-Transfer-Encoding', 'base64' );
                            res.setHeader( 'Content-Description', 'File Transfer' );
                            res.setHeader( 'Content-Disposition', 'attachment; filename="' + fileName + '"' );
                            res.setHeader( 'Content-Type', 'application/pdf' );

                            var buffer = new Buffer( pdfBody.data, 'base64' );
                            res.send( 200, buffer );
                            return next();
                        }
                    }
                } );
            }
        } ).catch( function( err ){
            _this.handleError( err, req, res );
            return next();
        } );
    }
};
