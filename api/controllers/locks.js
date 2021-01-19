




var Sequelize = require( 'sequelize' );
var moment = require( 'moment-timezone' );
var _ = require( 'lodash' );
var math = require( 'mathjs' );
var db = require( '../models' );
var Lock = db.Lock;
var notifier = require( '../lib/akx.notifier.js' );
var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;



exports.handleError = function( err, res, req ){
    util.handleError( 'document', err, res, req );
};



exports.check = function( req, res, next ){
    Lock.find( {
        where: {
            user_id: req.user.id,
            status: 1
        }
    } ).done( function( err, lock ){
        if( !!err ){
            return next();
        }
        else if( !lock ){
            return next();
        }
        else{
            res.send( 421, { errors: [ lock.message ] } );
        }
    } );
};
