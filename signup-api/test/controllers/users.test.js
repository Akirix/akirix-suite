process.env.NODE_ENV = 'test';

var request = require( 'supertest' );
var mongoose = require( 'mongoose' );
var _ = require( 'lodash' );

var app = require( '../../app.js' );
var config = require( '../../config/config.json' );
var dbUtil = require( '../components/db-utilities.js' );
var EmailVerification = mongoose.model( 'EmailVerification' );

describe( 'users', function(){

    // users.create
    describe( 'POST /users', function(){
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

        it( 'requires an email parameter', function( done ){
            var fixture = {
                "email": null,
                "hash": dbUtil.defaults.user.hash
            };

            request( app.server )
                .post( '/users' )
                .send( fixture )
                .set( 'Accept', 'application/json' )
                .expect( 'Content-Type', /json/ )
                .expect( 400 )
                .end( function( err, res ){
                    if ( err ) {
                        console.log( res.body );
                        done( err );
                    }
                    else {
                        done();
                    }
                } );
        } );

        it( 'requires a hash parameter', function( done ){
            var fixture = {
                "email": dbUtil.defaults.user.email,
                "hash": null
            };

            request( app.server )
                .post( '/users' )
                .send( fixture )
                .set( 'Accept', 'application/json' )
                .expect( 'Content-Type', /json/ )
                .expect( 400 )
                .end( function( err, res ){
                    if ( err ) {
                        console.log( res.body );
                        done( err );
                    }
                    else {
                        done();
                    }
                } );
        } );

        it( 'requires a post body', function( done ){
            var fixture = {
                "email": dbUtil.defaults.user.email,
                "hash": dbUtil.defaults.user.hash
            };

            request( app.server )
                .post( '/users' )
                .set( 'Accept', 'application/json' )
                .expect( 'Content-Type', /json/ )
                .expect( 400 )
                .end( function( err, res ){
                    if ( err ) {
                        console.log( res.body );
                        done( err );
                    }
                    else {
                        done();
                    }
                } );
        } );

        it( 'creates a new user from email and hash', function( done ){
            var fixture = {
                "email": dbUtil.defaults.user.email,
                "hash": dbUtil.defaults.user.hash
            };

            var User = mongoose.model( 'User' );
            var Registration = mongoose.model( 'Registration' );

            User.count( {}, function( err, count ){
                if( err ){
                    done( err );
                }
                else{
                    count.should.equal( 0 );

                    request( app.server )
                        .post( '/users' )
                        .send( fixture )
                        .set( 'Accept', 'application/json' )
                        .expect( 'Content-Type', /json/ )
                        .expect( 201 )
                        .end( function( err, res ){
                            if( err ){
                                console.log( res.body );
                                return done( err );
                            }
                            else{
                                User.count( {}, function( err, userCount ){
                                    if( err ){
                                        return done( err );
                                    }
                                    else{
                                        userCount.should.equal( 1 );

                                        Registration.count( { user_id: res.body.user._id }, function( err, regCount ){
                                            if( err ){
                                                done( err );
                                            }
                                            else{
                                                regCount.should.equal( 1 );

                                                res.body.user._id.should.equal( res.body.registration.user_id );
                                                res.body.user.email.should.be.equal( fixture.email );
                                                ( typeof res.body.user.hash === 'undefined' ).should.be.true;

                                                res.body.registration.ip.should.be.ok;
                                                res.body.registration.status.should.equal( 0 );
                                                res.body.registration.user.email.should.equal( fixture.email );

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

        it( 'should not allow the same user twice', function( done ){
            var fixture = {
                "email": dbUtil.defaults.user.email,
                "hash": dbUtil.defaults.user.hash
            };

            var User = mongoose.model( 'User' );

            var firstUser = new User( fixture );
            firstUser.save( function( err, user ){
                if( err ){
                    done( err );
                }
                else{
                    User.count( {}, function( err, count ){
                        if( err ){
                            console.log( res.body );
                            done( err );
                        }
                        else{
                            count.should.equal( 1 );

                            request( app.server )
                                .post( '/users' )
                                .send( fixture )
                                .set( 'Accept', 'application/json' )
                                .expect( 'Content-Type', /json/ )
                                .expect( 409 )
                                .end( function( err, res ){
                                    if( err ){
                                        console.log( res.body );
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

        // END Describe POST /users
    } );

    // users.getRegistration
    describe( 'GET /users/:user_id/get-registration', function(){
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

        it( 'requires authentication', function( done ){
            request( app.server )
                .get( '/users/' + dbUtil.defaults.registration.user_id + '/get-registration' )
                .set( 'Accept', 'application/json' )
                .expect( 401 )
                .end( function( err, res ){
                    if( err ){
                        console.log( res.body );
                        return done( err );
                    }
                    else{
                        done();
                    }
                } );
        } );

        it( 'session user_id must match request user_id parameter', function( done ){
            request( app.server )
                .get( '/users/not_an_id/get-registration' )
                .set( 'Accept', 'application/json' )
                .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                .expect( 400 )
                .end( function( err, res ){
                    if( err ){
                        console.log( res.body );
                        return done( err );
                    }
                    else{
                        done();
                    }
                } );
        } );

        it( 'returns the users registration', function( done ){
            request( app.server )
                .get( '/users/' + dbUtil.defaults.registration.user_id + '/get-registration' )
                .set( 'Accept', 'application/json' )
                .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                .expect( 200 )
                .end( function( err, res ){
                    if( err ){
                        console.log( res.body );
                        done( err );
                    }
                    else{
                        res.body.registration._id.should.equal( dbUtil.defaults.registration._id );
                        res.body.registration.user_id.should.equal( dbUtil.defaults.registration.user_id );
                        done();
                    }
                } );
        } );

        // END Describe GET /users/:user_id/get-registration
    } );

    //users.updatePassword
    describe( 'PUT /users/:user_id/update-password', function(){
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

        it( 'requires authentication', function( done ){
            var newPassword = 'notdemo';

            request( app.server )
                .put( '/users/not_the_right_id/update-password' )
                .send( { "hash": newPassword } )
                .set( 'Accept', 'application/json' )
                .expect( 401 )
                .end( function( err, res ){
                    if( err ){
                        return done( err );
                    }
                    else{
                        done();
                    }
                } );
        } );

        it( 'session user_id must match request user_id parameter', function( done ){
            var newPassword = 'notdemo';

            request( app.server )
                .put( '/users/not_the_right_id/update-password' )
                .send( { "hash": newPassword } )
                .set( 'Accept', 'application/json' )
                .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                .expect( 400 )
                .end( function( err, res ){
                    if( err ){
                        console.log( res.body );
                        return done( err );
                    }
                    else{
                        done();
                    }
                } );
        } );

        it( 'requires a hash parameter', function( done ){
            request( app.server )
                .put( '/users/' + dbUtil.defaults.registration.user_id + '/update-password' )
                .send( { } )
                .set( 'Accept', 'application/json' )
                .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                .expect( 400 )
                .end( function( err, res ){
                    if( err ){
                        console.log( res.body );
                        return done( err );
                    }
                    else{
                        done();
                    }
                } );
        } );

        it( 'requires a PUT body', function( done ){
            request( app.server )
                .put( '/users/' + dbUtil.defaults.registration.user_id + '/update-password' )
                .set( 'Accept', 'application/json' )
                .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                .expect( 400 )
                .end( function( err, res ){
                    if( err ){
                        console.log( res.body );
                        return done( err );
                    }
                    else{
                        done();
                    }
                } );
        } );

        it( 'updates the password so it can successfully log a user in', function( done ){
            var bcrypt = require( 'bcrypt' );
            var newPassword = 'notdemo';

            request( app.server )
                .put( '/users/' + dbUtil.defaults.registration.user_id + '/update-password' )
                .send( { "hash": newPassword } )
                .set( 'Accept', 'application/json' )
                .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                .expect( 201 )
                .end( function( err, res ){
                    if( err ){
                        return done( err );
                    }
                    else{
                        var User = mongoose.model( 'User' );
                        User.findOne( { _id: dbUtil.defaults.registration.user_id }, function( err, user ){
                            if( err ){
                                done( err );
                            }
                            else if( _.isEmpty( user ) ){
                                done( new Error( 'Missing user' ) );
                            }
                            else{
                                ( _.isEmpty( user.hash ) ).should.be.equal( false )
                                bcrypt.compareSync( newPassword, user.hash ).should.be.equal( true );
                                done();
                            }
                        } );
                    }
                } );
        } );
    } );

    //users.emailVerified
    describe( 'GET /users/:user_id/email-verified', function(){
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

        it( 'requires authentication', function( done ){
            request( app.server )
                .get( '/users/' + dbUtil.defaults.user._id + '/email-verified' )
                .set( 'Accept', 'application/json' )
                .expect( 401 )
                .end( function( err, res ){
                    if( err ){
                        console.log( res.body );
                        return done( err );
                    }
                    else{
                        done();
                    }
                } );
        } );

        it( 'session user_id must match request user_id parameter', function( done ){
            request( app.server )
                .get( '/users/notanid/email-verified' )
                .set( 'Accept', 'application/json' )
                .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                .expect( 400 )
                .end( function( err, res ){
                    if( err ){
                        console.log( res.body );
                        return done( err );
                    }
                    else{
                        done();
                    }
                } );
        } );

        it( 'doesn\'t create an additional entry if there all ready is one', function( done ){
            dbUtil.initPendingEmailVerfication( function( err ){
                if( err ){
                    done( err );
                }
                else{
                    request( app.server )
                        .get( '/users/' + dbUtil.defaults.user._id + '/email-verified' )
                        .set( 'Accept', 'application/json' )
                        .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                        .expect( 200 )
                        .end( function( err, res ){
                            if( err ){
                                console.log( res.body );
                                return done( err );
                            }
                            else{
                                res.body.verified.should.be.equal( false );

                                EmailVerification.find( { user_id: dbUtil.defaults.user._id }, function( err, result ){
                                    if( err ){
                                        done( err );
                                    }
                                    else{
                                        result.length.should.be.equal( 1 );
                                        done();
                                    }
                                } );
                            }
                        } );
                }
            } );
        } );

        it( 'creates a email verification if there is no verified entry', function( done ){
            request( app.server )
                .get( '/users/' + dbUtil.defaults.user._id + '/email-verified' )
                .set( 'Accept', 'application/json' )
                .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                .expect( 201 )
                .end( function( err, res ){
                    if( err ){
                        console.log( res.body );
                        return done( err );
                    }
                    else{
                        res.body.verified.should.be.equal( false );

                        EmailVerification.find( { user_id: dbUtil.defaults.user._id }, function( err, result ){
                            if( err ){
                                done( err );
                            }
                            else{
                                result.length.should.be.equal( 1 );
                                result[0].should.have.property( 'status', 0 );
                                result[0].should.have.property( 'to', dbUtil.defaults.user.email );
                                result[0].should.have.property( 'code' ).and.be.a.Number;
                                done();
                            }
                        } );
                    }
                } );
        } );

        it( 'returns a verified status if there is a verified entry', function( done ){
            dbUtil.initCompleteEmailVerfication( function( err ){
                if( err ){
                    done( err );
                }
                else{
                    request( app.server )
                        .get( '/users/' + dbUtil.defaults.user._id + '/email-verified' )
                        .set( 'Accept', 'application/json' )
                        .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                        .expect( 200 )
                        .end( function( err, res ){
                            if( err ){
                                console.log( res.body );
                                return done( err );
                            }
                            else{
                                res.body.verified.should.be.equal( true );

                                EmailVerification.find( { user_id: dbUtil.defaults.user._id }, function( err, result ){
                                    if( err ){
                                        done( err );
                                    }
                                    else{
                                        result.length.should.be.equal( 1 );
                                        done();
                                    }
                                } );
                            }
                        } );
                }
            } );
        } );
    } );

    //users.verifyEmail
    describe( 'POST /users/:user_id/verify-email', function(){
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

        it( 'requires authentication', function( done ){
            var fixture = {
                "code": '222222'
            };

            dbUtil.initPendingEmailVerfication( function( err ){
                if( err ){
                    done( err );
                }
                else{
                    request( app.server )
                        .post( '/users/' + dbUtil.defaults.user._id + '/verify-email' )
                        .send( fixture )
                        .set( 'Accept', 'application/json' )
                        .expect( 401 )
                        .end( function( err, res ){
                            if( err ){
                                console.log( res.body );
                                return done( err );
                            }
                            else{
                                done();
                            }
                        } );
                }
            } );
        } );

        it( 'wont verify an incorrect code', function( done ){
            var fixture = {
                "code": '222222'
            };

            dbUtil.initPendingEmailVerfication( function( err ){
                if( err ){
                    done( err );
                }
                else{
                    request( app.server )
                        .post( '/users/' + dbUtil.defaults.user._id + '/verify-email' )
                        .send( fixture )
                        .set( 'Accept', 'application/json' )
                        .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                        .expect( 400 )
                        .end( function( err, res ){
                            if( err ){
                                console.log( res.body );
                                return done( err );
                            }
                            else{
                                EmailVerification.find( { user_id: dbUtil.defaults.user._id }, function( err, result ){
                                    if( err ){
                                        done( err );
                                    }
                                    else{
                                        result.length.should.be.equal( 1 );
                                        result[0].should.have.property( 'status', 0 );
                                        result[0].should.have.property( 'to', dbUtil.defaults.user.email );
                                        done();
                                    }
                                } );
                            }
                        } );
                }
            } );
        } );

        it( 'requires a POST body', function( done ){

            dbUtil.initPendingEmailVerfication( function( err ){
                if( err ){
                    done( err );
                }
                else{
                    request( app.server )
                        .post( '/users/' + dbUtil.defaults.user._id + '/verify-email' )
                        .set( 'Accept', 'application/json' )
                        .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                        .expect( 400 )
                        .end( function( err, res ){
                            if( err ){
                                console.log( res.body );
                                return done( err );
                            }
                            else{
                                done();
                            }
                        } );
                }
            } );
        } );

        it( 'requires a code param', function( done ){
            var fixture = {
            };

            dbUtil.initPendingEmailVerfication( function( err ){
                if( err ){
                    done( err );
                }
                else{
                    request( app.server )
                        .post( '/users/' + dbUtil.defaults.user._id + '/verify-email' )
                        .send( fixture )
                        .set( 'Accept', 'application/json' )
                        .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                        .expect( 400 )
                        .end( function( err, res ){
                            if( err ){
                                console.log( res.body );
                                return done( err );
                            }
                            else{
                                done();
                            }
                        } );
                }
            } );
        } );

        it( 'verifies the correct code', function( done ){
            var fixture = {
                "code": dbUtil.defaults.emailVerification.code
            };

            dbUtil.initPendingEmailVerfication( function( err ){
                if( err ){
                    done( err );
                }
                else{
                    request( app.server )
                        .post( '/users/' + dbUtil.defaults.user._id + '/verify-email' )
                        .send( fixture )
                        .set( 'Accept', 'application/json' )
                        .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                        .expect( 201 )
                        .end( function( err, res ){
                            if( err ){
                                console.log( res.body );
                                return done( err );
                            }
                            else{
                                EmailVerification.find( { user_id: dbUtil.defaults.user._id }, function( err, result ){
                                    if( err ){
                                        done( err );
                                    }
                                    else{
                                        result.length.should.be.equal( 1 );
                                        result[0].should.have.property( 'status', 1 );
                                        result[0].should.have.property( 'to', dbUtil.defaults.user.email );
                                        done();
                                    }
                                } );
                            }
                        } );
                }
            } );
        } );
    } );

    // END users controller
} );