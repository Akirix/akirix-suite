

var _ = require( 'lodash' );
var moment = require( 'moment-timezone' );

var notifier = require( '../lib/akx.notifier.js' );
var util = require( '../lib/akx.util.js' );
var db = require( '../models' );
var Company = db.Company;
var Lead = db.Lead;
var routes = require( '../lib/routes.js' );
var _this = this;







exports.status = function( req, res, next ){
    res.send( 200, { status: 'ok' } );
    return next();
};







exports.now = function( req, res, next ){
    res.send( 200, { now: moment.utc().format() } );
    return next();
};







exports.sendInvite = function( req, res, next ){
    req.assert( 'data', 'isObject' );
    req.assert( 'data.name', 'isString' );
    req.assert( 'data.email', 'isString' );

    if( !_.isEmpty( req.validationErrors ) ){
        util.handleValidationErrors( req, res );
        return next();
    }
    else{
        Company.find( {
            where: [
                { id: req.user.company_id }
            ]
        } ).done( function( err, company ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                var newLead = Lead.build( {
                    user_id: req.user.id,
                    name: req.body.data.name,
                    company_name: req.body.data.company_name,
                    email: req.body.data.email
                } );

                newLead.save().done( function( err ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else{
                        notifier.sendEmail( 'akx-invitation', req.body.data.email, req.body.data.name, {
                            name: req.body.data.name,
                            from_name: req.user.name,
                            from_email: req.user.email,
                            from_company: company.name
                        }, req );

                        res.send( 200, { status: 'ok' } );
                        return next();
                    }
                } );

            }
        } );
    }
};

/**
 * @api {GET} /permissions returns default permissions
 * @apiName UtilitiesPermissions
 * @apiVersion 1.0.0
 * @apiGroup Utility
 * @apiDescription reads routes file and returns default permissions
 *
 * @apiSuccess {String} permissions json file with default permissions
 *
 **/

exports.permissions = function( req, res, next ){

    var defaultFalse = {
        "GET /funds": false,
        "POST /funds": false,
        "GET /funds/:fund_id": false,
        "PUT /funds/:fund_id": false,
        "POST /funds/:fund_id/add_project": false,
        "POST /funds/:fund_id/remove_project": false,
        "POST /funds/:fund_id/send": false,
        "POST /funds/:fund_id/accept": false,
        "POST /funds/:fund_id/decline": false,
        "POST /funds/:fund_id/withdraw": false
    };

    var defaultACL = {};

    var server = {
        get: function( path ){
            defaultACL[ "GET " + path ] = true;
        },
        put: function( path ){
            defaultACL[ "PUT " + path ] = true;
        },
        post: function( path ){
            defaultACL[ "POST " + path ] = true;
        },
        del: function( path ){
            defaultACL[ "DELETE " + path ] = true;
        }
    };

    var passport = {
        authenticate: function(){
        }
    };
    getServerRouterRoutes( passport, server, defaultACL, defaultFalse, res, next );
};

function getServerRouterRoutes( passport, server, defaultACL, defaultFalse, res, next ){
    routes( server, passport );
    var falseProps = _.keys( defaultFalse );
    for( var i = 0; i < falseProps.length; i++ ){
        _.forEach( defaultACL, function( obj ){
            if( defaultACL.hasOwnProperty( [ falseProps[ i ] ] ) ){
                defaultACL[ falseProps[ i ] ] = false;
            }
        } );
    }
    res.send( 200, defaultACL );
    return next();
}
