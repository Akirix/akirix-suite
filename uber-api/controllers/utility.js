var Sequelize = require( 'sequelize' );
var mongoose = require( 'mongoose' );
var Promise = require( 'promise' );
var db = require( '../models' );
var uberDb = require( '../models_uber' );
var moment = require( 'moment-timezone' );
var _ = require( 'lodash' );

var Wire = db.Wire;
var SignupRegistration = mongoose.model( 'Registration' );
var Ticket = db.Ticket;
var UberTask = uberDb.UberTask;
var WireBatch = db.WireBatch;
var FXRequest = db.FXRequest;
var CommissionPayment = db.CommissionPayment;
var Project = db.Project;

var logger = require( '../lib/akx.logger.js' );
var util = require( '../lib/akx.util.js' );
var _this = this;

exports.handleError = function( err, req, res ){
    util.handleError( 'uber-pending', err, req, res );
};

exports.getCounts = function( req, res, next ){

    var pendingResults = {
        wires: {
            wireIn: {},
            wireOut: {}
        },
        uberTasks: {},
        tickets: {},
        registrations: {},
        wireBatches: {},
        commissionPayments: {},
        projects: {}
    };
    var chainer = new Sequelize.Utils.QueryChainer;

    chainer.add( Wire.count( {
        where: {
            type: 0,
            status: 0
        }
    } ) );

    chainer.add( UberTask.count( {
        where: {
            due_date: {
                lte: moment( new Date() ).format( 'YYYY-MM-DD' + ' 23:59:59' )
            },
            type: 0,
            status: [ 0, 1 ]
        }
    } ) );

    chainer.add( Wire.count( {
        where: {
            type: 1,
            status: 0
        }
    } ) );

    chainer.add( UberTask.count( {
        where: {
            due_date: {
                lte: moment( new Date() ).format( 'YYYY-MM-DD' + ' 23:59:59' )
            },
            type: 0,
            status: [ 0, 1 ],
            uber_user_id: req.user.id
        }
    } ) );

    chainer.add( Ticket.count( {
        where: {
            uber_user_id: null,
            status: 0
        }
    } ) );

    chainer.add( WireBatch.count( {
        where: {
            status: 0
        }
    } ) );

    chainer.add( CommissionPayment.count( {
        where: {
            status: 0
        }
    } ) );

    chainer.add( Ticket.count( {
        where: {
            uber_user_id: req.user.id,
            status: 0
        }
    } ) );

    chainer.add( WireBatch.count( {
        where: {
            status: 1
        }
    } ) );

    chainer.add( WireBatch.count( {
        where: {
            status: 2
        }
    } ) );

    chainer.add( FXRequest.count( {
        where: {
            status: [ 0, 1 ]
        }
    } ) );

    chainer.add( Wire.count( {
        where: {
            type: 1,
            status: 4
        }
    } ) );

    chainer.add( Wire.count( {
        where: {
            type: 0,
            status: 4
        }
    } ) );

    chainer.add( Project.count( {
        where: {
            type: 0,
            deterministic: 1,
            status: 1
        }
    } ) );

    chainer.run().done( function( err, results ){
        if( !!err ){
            _this.handleError( err, req, res );
            return next();
        }
        else{
            pendingResults.wires.wireOut = { 'new': results[ 0 ], 'hold': results[ 12 ] };
            pendingResults.uberTasks = { due: results[ 1 ], dueUser: results[ 3 ] };
            pendingResults.wires.wireIn = { 'new': results[ 2 ], 'hold': results[ 11 ] };
            pendingResults.tickets = { unAssigned: results[ 4 ], ticketsUser: results[ 7 ] };
            pendingResults.wireBatches = { 'new': results[ 5 ], submitted: results[ 8 ], received: results[ 9 ] };
            pendingResults.commissionPayments = { 'new': results[ 6 ] };
            pendingResults.fxRequests = { 'open': results[ 10 ] };
            pendingResults.projects[ 'smart' ] = results[ 13 ];

            SignupRegistration.count( {
                status: 1
            }, function( err, registrationsCount ){
                if( !!err ){

                }
                else{
                    pendingResults.registrations = { completed: registrationsCount };
                    res.send( 200, { itemCounts: pendingResults } );
                }
            } );
        }
    } );
};
