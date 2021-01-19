process.env.NODE_ENV = 'test';

var request = require( 'supertest' );
var mongoose = require( 'mongoose' );
var _ = require( 'lodash' );

var app = require( '../../app.js' );
var config = require( '../../config/config.json' );
var dbUtil = require( '../components/db-utilities.js' );
var EmailVerification = mongoose.model( 'EmailVerification' );

describe( 'document-types', function(){

    // email-verification.create
    describe( 'POST /email-verifications', function(){
        beforeEach( function( done ){
            dbUtil.clearDB( app, function( err ){
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
        } );

        it( 'creates a new email-verification record', function( done ){
            var fixtures = {
                user_id: dbUtil.defaults.user._id
            };

            request( app.server )
                .post( '/email-verifications' )
                .send( fixtures )
                .set( 'Accept', 'application/json' )
                .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                .expect( 201 )
                .end( function( err, res ){
                    if( err ){
                        console.error( res.body );
                        return done( err );
                    }
                    else{
                        res.body.should.be.ok;

                        EmailVerification.find( {}, function( err, result ){
                            if( err ){
                                done( err );
                            }
                            else{
                                result.length.should.equal( 1 );
                                result[0].should.have.property( 'user_id', mongoose.Types.ObjectId( dbUtil.defaults.user._id ) );
                                result[0].should.have.property( 'to', dbUtil.defaults.user.email );
                                result[0].should.have.property( 'status', 0 );
                                done();
                            }
                        } );
                    }
                } );
        } );

        it( 'requires a user_id param', function( done ){
            var fixtures = {
            };

            request( app.server )
                .post( '/email-verifications' )
                .send( fixtures )
                .set( 'Accept', 'application/json' )
                .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                .expect( 400 )
                .end( function( err, res ){
                    if( err ){
                        console.error( res.body );
                        return done( err );
                    }
                    else{
                        done();
                    }
                } );
        } );

        it( 'requires a POST body', function( done ){
            request( app.server )
                .post( '/email-verifications' )
                .set( 'Accept', 'application/json' )
                .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                .expect( 400 )
                .end( function( err, res ){
                    if( err ){
                        console.error( res.body );
                        return done( err );
                    }
                    else{
                        done();
                    }
                } );
        } );

        it( 'requires authentication', function( done ){
            var fixtures = {
                user_id: dbUtil.defaults.user._id
            };

            request( app.server )
                .post( '/email-verifications' )
                .send( fixtures )
                .set( 'Accept', 'application/json' )
                .expect( 401 )
                .end( function( err, res ){
                    if( err ){
                        console.error( res.body );
                        return done( err );
                    }
                    else{
                        done();
                    }
                } );
        } );

        it( 'will not send an email if it has already sent one within the wait-time', function( done ){
            dbUtil.initPendingEmailVerfication( function( err ){
                if( err ){
                    done( err );
                }
                else{
                    var fixtures = {
                        user_id: dbUtil.defaults.user._id
                    };

                    request( app.server )
                        .post( '/email-verifications' )
                        .send( fixtures )
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

                                EmailVerification.find( {}, function( err, result ){
                                    if( err ){
                                        done( err );
                                    }
                                    else{
                                        result.length.should.equal( 1 );
                                        done();
                                    }
                                } );
                            }
                        } );
                }
            } );
        } );

        it( 'will not send an email if it there already is a completed entry', function( done ){
            dbUtil.initCompleteEmailVerfication( function( err ){
                if( err ){
                    done( err );
                }
                else{

                    // Completed emails never expire
                    var oldDate = new Date( '01/01/2014' );
                    EmailVerification.update( { _id: dbUtil.defaults.emailVerification._id }, { $set: { created: oldDate } }, function( err, numberAffected ){
                        if( err ){
                            done( err );
                        }
                        else{
                            numberAffected.should.be.equal( 1 );

                            var fixtures = {
                                user_id: dbUtil.defaults.user._id
                            };

                            request( app.server )
                                .post( '/email-verifications' )
                                .send( fixtures )
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

                                        EmailVerification.find( {}, function( err, result ){
                                            if( err ){
                                                done( err );
                                            }
                                            else{
                                                result.length.should.equal( 1 );
                                                done();
                                            }
                                        } );
                                    }
                                } );
                        }
                    } );

                }
            } );
        } );

        // END Describe POST /email-verifications
    } );

    // END email-verifications controller
} );