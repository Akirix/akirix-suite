

var Sequelize = require( 'sequelize' );
var db = require( '../models_uber' );
var _ = require( 'lodash' );

var UberTag = db.UberTag;
var UberTagAssociation = db.UberTagAssociation;

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;



exports.handleError = function( err, req, res ){
    util.handleError( 'uber-tag', err, req, res );
};



exports.index = function( req, res, next ){

    req.assert( 'model', 'isString' );
    req.assert( 'model_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){

        var query = {
            where: {},
            include: [
                {
                    model: UberTagAssociation,
                    where: {
                        model: req.params.model,
                        model_id: req.params.model_id
                    }
                }
            ],
            order: [
                [ 'name', 'ASC' ]
            ]
        };

        UberTag.findAll( query ).done( function( err, tags ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else if( !tags ){
                res.send( 200, { uberTags: [] } );
                return next();
            }
            else{
                res.send( 200, { uberTags: tags } );
                return next();
            }
        } )
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }

};