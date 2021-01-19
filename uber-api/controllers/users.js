var math = require( 'mathjs' );
var db = require( '../models' );
var uberDb = require( '../models_uber' );
var _ = require( 'lodash' );
var bcrypt = require( 'bcryptjs' );
var moment = require( 'moment-timezone' );
var jwt = require( 'jwt-simple' );
var tokenConfig = require( '../config/config.json' ).secrets.token;
var config = require( '../config/config.json' );
var twilioConfig = config.twilio;
var twilio = require( 'twilio' )( twilioConfig.sid, twilioConfig.token );

var Company = db.Company;
var User = db.User;
var Token = db.Token;
var UserSettings = db.UserSetting;
var Verification = db.Verification;
var UberUser = uberDb.UberUser;
var uuidV1 = require( 'node-uuid' ).v1;

var notifier = require( '../lib/akx.notifier.js' );
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'user', err, req, res );
};

exports.index = function( req, res, next ){
    var query = {};

    if( _.isString( req.params.company_id ) ){
        query[ 'where' ] = {
            company_id: req.params.company_id
        };
    }

    req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
    req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );

    var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
    if( paged ){
        query.offset = ( req.params.page - 1 ) * req.params.per_page;
        query.limit = req.params.per_page;
    }

    User.findAndCountAll( query )
        .done( function( err, users ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                var totalPages = 1;
                if( paged ){
                    var pageRatio = users.count / req.params.per_page;
                    totalPages = Math.floor( pageRatio );
                    if( pageRatio % 1 > 0 ){
                        totalPages++;
                    }
                }

                for( var i = 0; i < users.rows.length; i++ ){
                    if( _.has( users.rows[ i ].values, 'hash' ) ){
                        delete users.rows[ i ].values.hash;
                    }
                }

                res.send( 200, { users: users.rows, meta: { total_pages: totalPages } } );
                return next();
            }
        } );
};

exports.search = function( req, res, next ){

    req.assert( 'value', 'isString' );


    if( _.isEmpty( req.validationErrors ) ){
        var query = {
            where: {},
            order: 'updated_at DESC'
        };
        var queryParams = [];
        req.params[ 'page' ] = parseInt( req.params[ 'page' ] );
        req.params[ 'per_page' ] = parseInt( req.params[ 'per_page' ] );

        var paged = _.isNumber( req.params[ 'page' ] ) && _.isNumber( req.params[ 'per_page' ] ) && req.params.page >= 1 && req.params.per_page > 0;
        if( paged ){
            query.offset = ( req.params.page - 1 ) * req.params.per_page;
            query.limit = req.params.per_page;
        }

        req.params.value = req.params.value.trim();

        if( !_.isEmpty( req.params.value ) ){
            queryParams.push( { first_name: { like: '%' + req.params.value + '%' } } );
            queryParams.push( { last_name: { like: '%' + req.params.value + '%' } } );
            queryParams.push( { email: { like: '%' + req.params.value + '%' } } );
        }

        query.where = db.Sequelize.or.apply( _this, queryParams );

        User.findAndCountAll( query ).done( function( err, users ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                var totalPages = 1;
                if( paged ){
                    var pageRatio = users.count / req.params.per_page;
                    totalPages = Math.floor( pageRatio );
                    if( pageRatio % 1 > 0 ){
                        totalPages++;
                    }
                }

                res.send( 200, { users: users.rows, meta: { total_pages: totalPages } } );
                return next();
            }
        } );

    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.view = function( req, res, next ){

    req.assert( 'user_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        User.find( {
            where: {
                id: req.params.user_id
            }
        } )
            .done( function( err, user ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !user ){
                    res.send( 404 );
                    return next();
                }
                else{
                    if( _.has( user.values, 'hash' ) ){
                        delete user.values.hash;
                    }

                    res.send( 200, { user: user } );
                    return next();
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.updateUser = function( user, req, res, next ){
    var validParams = [
        { key: 'first_name', validation: 'isString' },
        { key: 'last_name', validation: 'isString' },
        { key: 'email', validation: 'isEmail' },
        { key: 'phone_mobile', validation: 'isString' },
        { key: 'access', validation: 'isString' },
        { key: 'status', validation: 'isNumber' },
        { key: 'account_owner', validation: 'isNumber' }
    ];

    _.forEach( validParams, function( value ){
        if( req.params.user.hasOwnProperty( value.key ) ){
            if( User.rawAttributes[ value.key ].allowNull && req.params.user[ value.key ] === null ){
                user.values[ value.key ] = null;
            }
            else if( req.assert( 'user.' + value.key, value.validation ) === true ){
                user.values[ value.key ] = req.params.user[ value.key ];
            }
        }
    } );

    return user.save().done( function( err ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else{

            if( user.values.hasOwnProperty( 'hash' ) ){
                delete user.values.hash;
            }

            res.send( 200, { user: user } );

            logger.info( 'user', 'User' + user.first_name + ' ' + user.last_name + ' has been updated', {
                req: req,
                model: 'user',
                model_id: user.id
            } );

            return next();
        }
    } );

};


exports.update = function( req, res, next ){

    req.assert( 'user_id', 'isString' );
    req.assert( 'user', 'isObject' );

    if( _.isEmpty( req.validationErrors ) ){
        User.find( {
            where: {
                id: req.params.user_id
            }
        } ).done( function( err, user ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !user ){
                res.send( 404 );
                return next();
            }
            else{
                if( req.params.user[ 'account_owner' ] === 0 ){
                    return User.count( {
                        where: {
                            account_owner: 1,
                            status: 1,
                            company_id: user.company_id,
                            id: { ne: req.params.user_id }
                        }
                    } ).then( function( userAccountOwnersCount ){
                        if( userAccountOwnersCount >= 1 ){
                            return _this.updateUser( user, req, res, next )
                        }
                        else{
                            res.send( 400, { error: "Each company should have at least one account owner." } );
                            return next();
                        }
                    } ).catch( function( err ){
                        _this.handleError( err, req, res );
                        return next();
                    } );
                }
                else{
                    return _this.updateUser( user, req, res, next );
                }

            }
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};


exports.passwordReset = function( req, res, next ){
    req.assert( 'user_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        User.find( {
            where: {
                id: req.params.user_id
            }
        } )
            .done( function( err, user ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !user ){
                    res.send( 404 );
                    return next();
                }
                else{
                    var salt = bcrypt.genSaltSync( 10 );
                    var newPassword = math.randomInt( 0x1D39D3E06400000, 0x41C21CB8E0FFFFFF ).toString( 36 );
                    user.values.hash = bcrypt.hashSync( newPassword, salt );
                    user.save().done( function( err ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else{
                            res.send( 200, { password: newPassword } );
                            logger.info( 'user', 'Password has been reset for user ' + user.first_name + user.last_name + ']', {
                                req: req,
                                model: 'user',
                                model_id: user.id
                            } );
                            return next();
                        }
                    } );
                }
            } )
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.impersonate = function( req, res, next ){
    req.assert( 'user_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        User.find( {
            where: {
                id: req.params.user_id
            }
        } ).then( function( user ){
            if( !user ){
                res.send( 404 );
                return next();
            }
            else{
                var expDate = moment.utc().add( 15, 'minutes' ).format();

                var payload = {
                    id: req.params.user_id,
                    email: req.params.email,
                    name: user.first_name + ' ' + user.last_name,
                    expires: expDate,
                    ip: req.headers[ 'x-real-ip' ]
                };
                var tokenData = {
                    id: user.id,
                    uuid: uuidV1()
                };

                var data = {
                    data: jwt.encode( payload, tokenConfig ),
                    token: jwt.encode( tokenData, tokenConfig ),
                    expires: expDate,
                    two_factor_expires: expDate,
                    user_id: user.id,
                    company_id: user.company_id,
                    access: user.access
                };
                var newToken = Token.build( data );

                return newToken.save().then( function( token ){
                    res.send( 200, { access_token: token.token } );
                    return next();

                } )
            }
        } ).catch( function( err ){
            _this.handleError( err, req, res );
            return next();
        } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};





exports.create = function( req, res, next ){
    req.assert( 'user', 'isObject' );
    req.assert( 'user.company_id', 'isString' );
    req.assert( 'user.first_name', 'isString' );
    req.assert( 'user.last_name', 'isString' );
    req.assert( 'user.email', 'isString' );
    req.assert( 'user.phone_mobile', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Company.find( {
            where: {
                id: req.params.user.company_id
            }
        } )
            .done( function( err, company ){
                    if( !!err ){
                        _this.handleError( err, req, res );
                        return next();
                    }
                    else{
                        User.find( {
                            where: {
                                email: req.params.user.email
                            }
                        } )
                            .done( function( err, existingUser ){
                                if( !!err ){
                                    _this.handleError( err, req, res );
                                    return next();
                                }
                                else if( existingUser ){
                                    res.send( 400, { errors: [ 'E-mail is already used by an existing user.' ] } );
                                    return next();
                                }
                                else{
                                    User.find( {
                                        where: {
                                            company_id: req.params.user.company_id,
                                            status: 1
                                        },
                                        order: "created_at ASC"
                                    } )
                                        .done( function( err, user ){
                                            if( !!err ){
                                                _this.handleError( err, req, res );
                                                return next();
                                            }
                                            else if( !user ){
                                                res.send( 400, { errors: [ 'Error setting user access.' ] } );
                                                return next();
                                            }
                                            else{
                                                return db.sequelize.transaction( function ( t ) {

                                                    var newUser = User.build( {
                                                        company_id: req.params.user.company_id,
                                                        first_name: req.params.user.first_name,
                                                        last_name: req.params.user.last_name,
                                                        email: req.params.user.email,
                                                        phone_mobile: req.params.user.phone_mobile,
                                                        hash: "1",
                                                        access: user.access,
                                                        status: 1
                                                    } );
                                                    newUser.save( { transaction: t } )
                                                        .done( function( err ){
                                                            if( !!err ){
                                                                t.rollback();
                                                                _this.handleError( err, req, res );
                                                                return next();
                                                            }
                                                            else{
                                                                var newUserSettings = UserSettings.build( {
                                                                    user_id: newUser.id
                                                                } );
                                                                newUserSettings.save( { transaction: t } )
                                                                    .done( function( err ){
                                                                        if( !!err ){
                                                                            t.rollback();
                                                                            _this.handleError( err, req, res );
                                                                            return next();
                                                                        }
                                                                        else{
                                                                            t.commit();
                                                                            logger.info( 'user', 'user ' + newUser.first_name + newUser.last_name + ' has been added', {
                                                                                req: req,
                                                                                model: 'user',
                                                                                model_id: newUser.id
                                                                            } );
                                                                            res.send( 201, { user: newUser } );
                                                                            return next();
                                                                        }
                                                                    } );
                                                            }
                                                        } );
                                                } );
                                            }
                                        } )
                                }
                            } );
                    }
                }
            )
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    } 
};

