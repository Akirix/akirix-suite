process.env.NODE_ENV = 'test';

var request = require( 'supertest' );
var mongoose = require( 'mongoose' );
var _ = require( 'lodash' );

var app = require( '../../app.js' );
var config = require( '../../config/config.json' );
var dbUtil = require( '../components/db-utilities.js' );
var Inquiry = mongoose.model( 'Inquiry' );

describe( 'inquiries', function(){

    // inquiries.get
    describe( 'GET /inquiries:account_type', function(){
        beforeEach( function( done ){
            dbUtil.clearDB( app, function( err ){
                if( err ){
                    done( err );
                }
                else{
                    dbUtil.initInquiries( function( err ){
                        if( err ){
                            done( err );
                        }
                        else{
                            dbUtil.initializeDB( function( err ){
                                if( err ){
                                    done( err );
                                }
                                else{
                                    done();
                                }
                            } );
                        }
                    } );
                }
            } );
        } );

        it( 'returns a list of inquiries', function( done ){
            request( app.server )
                .get( '/inquiries/' + dbUtil.defaults.registration.account_type )
                .set( 'Accept', 'application/json' )
                .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                .expect( 200 )
                .end( function( err, res ){
                    if( err ){
                        console.error( res.body );
                        return done( err );
                    }
                    else{
                        res.body.should.be.ok;

                        Inquiry.count( { account_type: dbUtil.defaults.registration.account_type }, function( err, result ){
                            if( err ){
                                done( err );
                            }
                            else{
                                res.body.length.should.equal( result );
                                done();
                            }
                        } );
                    }
                } );
        } );

        it( 'requires authentication', function( done ){
            request( app.server )
                .get( '/inquiries/' + dbUtil.defaults.registration.account_type )
                .set( 'Accept', 'application/json' )
                .expect( 401 )
                .end( function( err, res ){
                    if( err ){
                        console.error( res.body );
                        return done( err );
                    }
                    else{
                        res.body.should.be.ok;
                        done();
                    }
                } );
        } );

        // END Describe GET /inquiries:account_type
    } );

    // END document-types controller
} );