

var _ = require( 'lodash' );
var moment = require( 'moment-timezone' );

var notifier = require( '../lib/akx.notifier.js' );
var util = require( '../lib/akx.util.js' );
var db = require( '../models' );
var Company = db.Company;
var Lead = db.Lead;
var routes = require( '../lib/routes.js' );
var _this = this;
var request = require( 'request' );
var msgConfig = require( '../config/config.json' ).msg_api;






exports.status = function( req, res, next ){
    res.send( 200, { status: 'ok' } );
    return next();
};







exports.now = function( req, res, next ){
    res.send( 200, { now: moment.utc().format() } );
    return next();
};





exports.sendEmail = function( req, res, next ){
    req.assert( 'data', 'isObject' );
    req.assert( 'sender', 'isObject' );
    req.assert( 'sender.email', 'isString' )
    req.assert( 'recipients', 'isArray' );
    req.assert( 'template_name', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        var recipientErrors = [];
        var recipientFields = [
            //{ value: 'name', validation: _.isString, message: [ 'Must be a string' ] },
            { value: 'email', validation: _.isString, message: [ 'Must be a string' ] },
            { value: 'type', validation: _.isString, message: [ 'Must be a string' ] }
        ];
        req.body.recipients.map( function( obj, idx ){
            _.forEach( recipientFields, function( recipientField ){
                var eObj = {};
                var itm = ("recipients[" + idx + "]['" + recipientField.value + "']");
                eObj[ itm ] = recipientField.message;
                return recipientField.validation( obj[ recipientField.value ] ) ? null : recipientErrors.push( eObj );
            } );
        } );
        if( _.isEmpty( recipientErrors ) ){
            var payload = req.body;
            payload[ 'key' ] = msgConfig.mandrillApiKey;
            payload[ 'email' ] = 'nobody@xxx.com';

            request.post( {
                url: msgConfig.host + '/emails',
                json: payload
            }, function( err, response, body ){
                if( err ){
                    res.send( 400, { errors: [ response.body, response.statusCode ] } );
                    return next();
                }
                else{
                    if( response.statusCode === 200 || response.statusCode === 201 ){
                        res.send( 201, { email: body.mandrillResult } );
                        return next();
                    }
                    else{
                        res.send( response.statusCode, { errors: [ response.body ] } );
                        return next();
                    }
                }
            } );
        }
        else{
            res.send( 422, { errors: recipientErrors } );
            return next();
        }
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }

};
