



var _ = require( 'lodash' );
var moment = require( 'moment-timezone' );
var db = require( '../models' );
var WireTemplate = db.WireTemplate;

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;



exports.handleError = function( err, req, res ){
    util.handleError( 'wire-template', err, req, res );
};






exports.create = function( req, res, next ){
    req.assert( 'wireTemplate', 'isObject' );
    req.assert( 'wireTemplate.bank_city', 'isString' );
    req.assert( 'wireTemplate.bank_address', 'isString' );
    req.assert( 'wireTemplate.bank_state_province', 'isString' );
    req.assert( 'wireTemplate.bank_postal_code', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        var newTemplate = WireTemplate.build( req.body.wireTemplate );

        newTemplate.values.company_id = req.body.wireTemplate.company_id;

        newTemplate.save()
            .done( function( err ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{
                    res.send( 201, { wireTemplate: newTemplate } );
                    logger.info( 'wire-template', '[' + newTemplate.id + ']', {
                        req: req
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
                { company_id: req.params.company_id }
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





exports.update = function( req, res, next ){

    req.assert( 'wire_template_id', 'isString' );
    req.assert( 'wireTemplate', 'isObject' );
    req.assert( 'wireTemplate.bank_city', 'isString' );
    req.assert( 'wireTemplate.bank_address', 'isString' );
    req.assert( 'wireTemplate.bank_state_province', 'isString' );
    req.assert( 'wireTemplate.bank_postal_code', 'isString' );



    if( _.isEmpty( req.validationErrors ) ){
        WireTemplate.find( {
                where: [
                    { id: req.params.wire_template_id }
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

                    template.updateAttributes( req.body.wireTemplate )
                        .done( function( err ){
                            if( !!err ){
                                _this.handleError( err, req, res );
                                return next();
                            }
                            else{
                                logger.info( 'wire-template', ' [' + template.id + ']', {
                                    req: req
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
                    { id: req.params.wire_template_id }
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
                            logger.info( 'wire-template', ' [' + template.id + ']', {
                                req: req
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