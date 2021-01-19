var _ = require( 'lodash' );
var bcrypt = require( 'bcryptjs' );
var moment = require( 'moment-timezone' );
var db = require( '../models' );
var uberDb = require( '../models_uber' );

var logger = require( '../lib/akx.logger.js' );
var notifier = require( '../lib/akx.notifier.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

var User = db.User;
var SecurityQuestion = db.SecurityQuestion;

exports.handleError = function( err, req, res ){
    util.handleError( 'security-question', err, req, res );
};

exports.index = function( req, res, next ){
    var query = {
        where: [],
        order: [
            [ 'created_at', 'ASC' ]
        ]
    };

    if( !_.isEmpty( req.params.user_id ) ){
        query.where.push( { user_id: req.params.user_id } );
    }

    if( !_.isEmpty( req.params.company_id ) ){
        query.where.push( { company_id: req.params.company_id } );

        if( !query.where.hasOwnProperty( 'user_id' ) ){
            query.where.push( { user_id: null } );
        }
    }


    SecurityQuestion.findAll( query ).then( function( securityQuestions ){
        res.send( 200, { securityQuestions: securityQuestions } );
        return next();
    } ).catch( function( err ){
        _this.handleError( err, req, res );
        return next();
    } );
};

exports.view = function( req, res, next ){
    req.assert( 'securityQuestion', 'isObject' );
    req.assert( 'securityQuestion.user_id', 'isString' );
    req.assert( 'securityQuestion.company_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        SecurityQuestion.find( {
            where: {
                id: req.params.security_question_id,
            }
        } ).then( function( securityQuestion ){
            if( !securityQuestion ){
                res.send( 404, { errors: [ 'No security question found' ] } );
                return next();
            }
            else{
                res.send( 200, { securityQuestion: securityQuestion } );
                return next();
            }
        } ).catch( function( err ){
            _this.handleError( err, req, res );
            return next();
        } )
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.create = function( req, res, next ){
    req.assert( 'securityQuestion', 'isObject' );
    req.assert( 'securityQuestion.user_id', 'isString' );
    req.assert( 'securityQuestion.company_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        User.find( {
            where: {
                id: req.body.securityQuestion.user_id,
                company_id: req.body.securityQuestion.company_id
            }
        } ).then( function( user ){
            if( !user ){
                res.send( 404, { errors: [ 'No user found' ] } );
                return next();
            }
            else{
                var newSecurityQuestion = SecurityQuestion.build( {
                    question: req.body.securityQuestion.question,
                    answer: req.body.securityQuestion.answer,
                    user_id: user.id,
                    company_id: user.company_id,
                    type: 1
                } );

                newSecurityQuestion.save()
                    .then( function(){
                        res.send( 200, { securityQuestion: newSecurityQuestion } );
                        logger.info( 'security-question', 'New security question added for user [' + user.id + ']', {
                            req: req,
                            model: 'security-question',
                            model_id: newSecurityQuestion.id
                        } );
                        return next();
                    } )
                    .catch( function( err ){
                        _this.handleError( err, req, res );
                        return next();
                    } )
            }
        } ).catch( function( err ){
            _this.handleError( err, req, res );
            return next();
        } )
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};

exports.delete = function( req, res, next ){
    req.assert( 'security_question_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        SecurityQuestion.find( {
            where: {
                id: req.params.security_question_id
            }
        } ).then( function( securityQuestion ){
            if( !securityQuestion ){
                res.send( 404, { errors: [ 'No Security Question found' ] } );
                return next();
            }
            else{
                securityQuestion.destroy()
                    .then( function(){
                        res.send( 200, { securityQuestion: securityQuestion } );
                        return next();
                    } ).catch( function( err ){
                    _this.handleError( err, req, res );
                    return next();
                } )
            }
        } )
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};
