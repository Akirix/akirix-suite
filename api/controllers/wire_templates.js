



var _ = require( 'lodash' );
var moment = require( 'moment-timezone' );
var db = require( '../models' );
var WireTemplate = db.WireTemplate;
var User = db.User;

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;



exports.handleError = function( err, req, res ){
    util.handleError( 'wire-template', err, req, res );
};






exports.create = function( req, res, next ){

    req.assert( 'wireTemplate', 'isObject' );
    req.assert( 'wireTemplate.bank_address', 'isString' );
    req.assert( 'wireTemplate.bank_postal_code', 'isString' );
    req.assert( 'wireTemplate.bank_city', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        var newTemplate = WireTemplate.build( req.body.wireTemplate );
        newTemplate.company_id = req.user.company_id;

        newTemplate.save()
            .done( function( err ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{
                    res.send( 201, { wireTemplate: newTemplate } );
                    logger.info( 'wire-template', 'New wire template has been created [' + newTemplate.id + ']', {
                        req: req,
                        model: 'wire-template',
                        model_id: newTemplate.id
                    } );
                    return next();
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};





exports.index = function( req, res, next ){

    WireTemplate.findAll( {
        where: [
            { company_id: req.user.company_id }
        ]
    } )
        .done( function( err, wireTemplates ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                res.send( 200, { wireTemplates: wireTemplates } );
                return next();
            }
        } );
};




exports.view = function( req, res, next ){

    req.assert( 'wire_template_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        WireTemplate.find( {
            where: [
                { id: req.params.wire_template_id },
                { company_id: req.user.company_id }
            ]
        } )
            .done( function( err, template ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !template ){
                    res.send( 404 );
                    return next();
                }
                else{
                    res.send( 200, { wireTemplate: template } );
                    return next();
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};





exports.update = function( req, res, next ){

    req.assert( 'wire_template_id', 'isString' );
    req.assert( 'wireTemplate', 'isObject' );
    req.assert( 'wireTemplate.bank_address', 'isString' );
    req.assert( 'wireTemplate.bank_state_province', 'isString' );
    req.assert( 'wireTemplate.bank_postal_code', 'isString' );
    req.assert( 'wireTemplate.bank_city', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        WireTemplate.find( {
            where: [
                { id: req.params.wire_template_id },
                { company_id: req.user.company_id }
            ]
        } )
            .done( function( err, template ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !template ){
                    res.send( 404 );
                    return next();
                }
                else{
                    req.body.wireTemplate.id = template.id;
                    req.body.wireTemplate.company_id = req.user.company_id;

                    template.updateAttributes( req.body.wireTemplate )
                        .done( function( err ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else{
                                logger.info( 'wire-template', 'Wire template [' + template.id + '] has been updated', {
                                    req: req,
                                    model: 'wire-template',
                                    model_id: template.id
                                } );
                                res.send( 200, { wireTemplate: template } );
                                return next();
                            }
                        } )
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};




exports.delete = function( req, res, next ){

    req.assert( 'wire_template_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        WireTemplate.find( {
            where: [
                { id: req.params.wire_template_id },
                { company_id: req.user.company_id }
            ]
        } )
            .done( function( err, template ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else if( !template ){
                    res.send( 404 );
                    return next();
                }
                else{
                    template.destroy().done( function( err ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else{
                            res.send( 200, { wireTemplate: template } );
                            logger.info( 'wire-template', 'Wire template [' + template.name + '] has been deleted', {
                                req: req,
                                model: 'wire-template',
                                model_id: template.id
                            } );
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