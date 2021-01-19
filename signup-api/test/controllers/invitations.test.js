process.env.NODE_ENV = 'test';

var request = require( 'supertest' );
var mongoose = require( 'mongoose' );
var _ = require( 'lodash' );

var app = require( '../../app.js' );
var config = require( '../../config/config.json' );
var dbUtil = require( '../components/db-utilities.js' );
var Invitation = mongoose.model( 'Invitation' );
var Registration = mongoose.model( 'Registration' );
var User = mongoose.model( 'User' );

describe( 'invitations', function(){

    // invitations.complete
    describe( 'POST /invitations/complete', function(){
        beforeEach( function( done ){
            dbUtil.clearDB( app, function( err ){
                if( err ){
                    done( err );
                }
                else{
                    done();
                }
            } );
        } );

        it( 'should update the invitation status to 2', function( done ){
            var fixtures = {
                email: dbUtil.defaults.user.email,
                hash: dbUtil.defaults.user.hash,
                uuid: dbUtil.defaults.invitation.uuid
            };

            dbUtil.initPendingInvitation( function( err ){
                if( err ){
                    done( err );
                }
                else{
                    request( app.server )
                        .post( '/invitations/complete' )
                        .set( 'Accept', 'application/json' )
                        .send( fixtures )
                        .expect( 201 )
                        .end( function( err, res ){
                            if( err ){
                                console.error( res.body );
                                return done( err );
                            }
                            else{
                                res.body.should.be.ok;

                                Invitation.find( { _id: dbUtil.defaults.invitation._id }, function( err, result ){
                                    if( err ){
                                        done( err );
                                    }
                                    else{
                                        result.length.should.equal( 1 );
                                        result[0].status.should.equal( 2 );
                                        done();
                                    }
                                } );
                            }
                        } );
                }
            } );
        } );

        it( 'requires a email param', function( done ){
            var fixtures = {
                hash: dbUtil.defaults.user.hash,
                uuid: dbUtil.defaults.invitation.uuid
            };

            dbUtil.initPendingInvitation( function( err ){
                if( err ){
                    done( err );
                }
                else{
                    request( app.server )
                        .post( '/invitations/complete' )
                        .set( 'Accept', 'application/json' )
                        .send( fixtures )
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
                }
            } );
        } );

        it( 'requires a hash param', function( done ){
            var fixtures = {
                email: dbUtil.defaults.user.email,
                uuid: dbUtil.defaults.invitation.uuid
            };

            dbUtil.initPendingInvitation( function( err ){
                if( err ){
                    done( err );
                }
                else{
                    request( app.server )
                        .post( '/invitations/complete' )
                        .set( 'Accept', 'application/json' )
                        .send( fixtures )
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
                }
            } );
        } );

        it( 'requires a uuid param', function( done ){
            var fixtures = {
                email: dbUtil.defaults.user.email,
                hash: dbUtil.defaults.user.hash
            };

            dbUtil.initPendingInvitation( function( err ){
                if( err ){
                    done( err );
                }
                else{
                    request( app.server )
                        .post( '/invitations/complete' )
                        .set( 'Accept', 'application/json' )
                        .send( fixtures )
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
                }
            } );
        } );

        it( 'requires a POST body', function( done ){
            dbUtil.initPendingInvitation( function( err ){
                if( err ){
                    done( err );
                }
                else{
                    request( app.server )
                        .post( '/invitations/complete' )
                        .set( 'Accept', 'application/json' )
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
                }
            } );
        } );

        it( 'should create a new user with the details from the invitation', function( done ){
            var fixtures = {
                email: dbUtil.defaults.user.email,
                hash: dbUtil.defaults.user.hash,
                uuid: dbUtil.defaults.invitation.uuid
            };

            dbUtil.initPendingInvitation( function( err ){
                if( err ){
                    done( err );
                }
                else{
                    request( app.server )
                        .post( '/invitations/complete' )
                        .set( 'Accept', 'application/json' )
                        .send( fixtures )
                        .expect( 201 )
                        .end( function( err, res ){
                            if( err ){
                                console.error( res.body );
                                return done( err );
                            }
                            else{
                                res.body.should.be.ok;
                                res.body.should.have.property( 'user' );

                                User.find( { }, function( err, result ){
                                    if( err ){
                                        done( err );
                                    }
                                    else{
                                        result.length.should.equal( 1 );

                                        result[0].should.have.property( 'email', fixtures.email );
                                        res.body.user.should.have.property( 'email', fixtures.email );

                                        res.body.user.should.have.property( 'status', result[0].status );
                                        result[0].status.should.be.equal( 1 );

                                        done();
                                    }
                                } );
                            }
                        } );
                }
            } );
        } );

        it( 'should create a new registration with the details from the invitation', function( done ){
            var fixtures = {
                email: dbUtil.defaults.user.email,
                hash: dbUtil.defaults.user.hash,
                uuid: dbUtil.defaults.invitation.uuid
            };

            dbUtil.initPendingInvitation( function( err ){
                if( err ){
                    done( err );
                }
                else{
                    request( app.server )
                        .post( '/invitations/complete' )
                        .set( 'Accept', 'application/json' )
                        .send( fixtures )
                        .expect( 201 )
                        .end( function( err, res ){
                            if( err ){
                                console.error( res.body );
                                return done( err );
                            }
                            else{
                                res.body.should.be.ok;
                                res.body.should.have.property( 'registration' );

                                Registration.find( { }, function( err, result ){
                                    if( err ){
                                        done( err );
                                    }
                                    else{
                                        result.length.should.equal( 1 );

                                        result[0].should.have.property( 'user' );
                                        res.body.registration.should.have.property( 'user' );

                                        result[0].user.should.have.property( 'email', fixtures.email );
                                        res.body.registration.user.should.have.property( 'email', fixtures.email );

                                        result[0].should.have.property( 'account_type', 'invitee' );
                                        res.body.registration.should.have.property( 'account_type', 'invitee' );

                                        res.body.registration.should.have.property( 'status', 0 );
                                        result[0].should.have.property( 'status', 0 );

                                        res.body.registration.should.have.property( 'parent_id', fixtures.uuid );
                                        result[0].should.have.property( 'parent_id', fixtures.uuid );

                                        done();
                                    }
                                } );
                            }
                        } );
                }
            } );
        } );

        // END Describe GET /inquiries:account_type
    } );

    // END document-types controller
} );