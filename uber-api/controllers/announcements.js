




var db = require( '../models' );
var moment = require( 'moment-timezone' );
var _ = require( 'lodash' );
var Announcement = db.Announcement;
var util = require( '../lib/akx.util.js' );
var _this = this;

var notifier = require( '../lib/akx.notifier.js' );
var logger = require( '../lib/akx.logger.js' );
;

exports.handleError = function( err, req, res ){
    util.handleError( 'announcement', err, req, res );
};





exports.index = function( req, res, next ){
    Announcement.findAll( {
            order: [
                [ 'publish_to', 'DESC' ]
            ]
        } )
        .done( function( err, announcements ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                res.send( 200, { announcements: announcements } );
                return next();
            }
        } );
};





exports.view = function( req, res, next ){

    req.assert( 'announcement_id', 'isString' );

    if( _.isEmpty( req.validationErrors ) ){
        Announcement.find( {
                where: {
                    id: req.params.announcement_id
                }
            } )
            .done( function( err, announcement ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }

                else{
                    res.send( 200, { announcement: announcement } );
                    return next();
                }
            } );
    }
    else{
        util.handleValidationErrors( req, res );
        return next();
    }
};





exports.create = function( req, res, next ){


    req.assert( 'announcement', 'isObject' );
    req.assert( 'announcement.name', 'isString' );
    req.assert( 'announcement.notes', 'isString' );
    req.assert( 'announcement.publish_from', 'isString' );
    req.assert( 'announcement.publish_to', 'isString' );


    var newAnnouncement = Announcement.build( {
        name: req.params.announcement.name,
        publish_from: req.params.announcement.publish_from,
        publish_to: req.params.announcement.publish_to,
        notes: req.params.announcement.notes
    } );

    newAnnouncement.save()
        .done( function( err ){
            if( !!err ){
                _this.handleError( err, req, res );
                return next();
            }
            else{
                logger.info( 'announcement', 'announcement[' + newAnnouncement.id + '] added', {
                    req: req
                } );

                res.send( 201, { announcement: newAnnouncement } );
                return next();
            }
        } );
};







exports.update = function( req, res, next ){

    req.assert( 'announcement_id', 'isString' );
    req.assert( 'announcement', 'isObject' );
    req.assert( 'announcement', 'isObject' );
    req.assert( 'announcement.name', 'isString' );
    req.assert( 'announcement.notes', 'isString' );
    req.assert( 'announcement.publish_from', 'isString' );
    req.assert( 'announcement.publish_to', 'isString' );


    if( _.isEmpty( req.validationErrors ) ){
        Announcement.find( {
                where: {
                    id: req.params.announcement_id
                }
            } )
            .done( function( err, announcement ){
                if( !!err ){
                    _this.handleError( err, req, res );
                    return next();
                }
                else{
                    var updateValues = [
                        { value: 'name', validation: _.isString },
                        { value: 'publish_from', validation: _.isString },
                        { value: 'publish_to', validation: _.isString },
                        { value: 'notes', validation: _.isString }
                    ];

                    _.forEach( updateValues, function( updateValue ){
                        if( updateValue.validation( req.params.announcement[ updateValue.value ] ) ){
                            announcement[ updateValue.value ] = req.params.announcement[ updateValue.value ];
                        }
                    } );

                    announcement.save().done( function( err ){
                        if( !!err ){
                            _this.handleError( err, req, res );
                            return next();
                        }
                        else{

                            logger.info( 'announcement', 'announcement[' + announcement.id + '] updated', {
                                req: req
                            } );
                            res.send( 200, { announcement: announcement } );
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