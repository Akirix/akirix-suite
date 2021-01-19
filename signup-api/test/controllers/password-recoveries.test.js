process.env.NODE_ENV = 'test';

var request = require( 'supertest' );
var mongoose = require( 'mongoose' );
var _ = require( 'lodash' );

var app = require( '../../app.js' );
var config = require( '../../config/config.json' );
var dbUtil = require( '../components/db-utilities.js' );
var PasswordRecovery = mongoose.model( 'PasswordRecovery' );
var User = mongoose.model( 'User' );
var bcrypt = require( 'bcrypt' );

describe( 'password-recoveries', function(){

    // password-recoveries.create
    describe( 'POST /password-recoveries', function(){
        beforeEach( function( done ){
            dbUtil.clearDB( app, function( err ){
                if( err ){
                    done( err );
                }
                else{
                    dbUtil.initUser( function( err ){
                        if( err ){
                            done( err );
                        }
                        else{
                            dbUtil.initRegistration( function( err ){
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

        it( 'creates a new password recovery entry', function( done ){
            var fixtures = {
                email: dbUtil.defaults.user.email
            };

            request( app.server )
                .post( '/password-recoveries' )
                .send( fixtures )
                .set( 'Accept', 'application/json' )
                .expect( 201 )
                .end( function( err, res ){
                    if( err ){
                        console.error( res.body );
                        return done( err );
                    }
                    else{
                        PasswordRecovery.find( {}, function( err, result ){
                            if( err ){
                                done( err );
                            }
                            else{
                                _.isEmpty( result ).should.be.equal( false );
                                result.length.should.be.equal( 1 );
                                result[0].should.have.property( 'status', 0 );
                                result[0].should.have.property( 'user_id', mongoose.Types.ObjectId( dbUtil.defaults.user._id ) );
                                done();
                            }
                        } );
                    }
                } );
        } );

        it( 'requires an email param', function( done ){
            var fixtures = {
            };

            request( app.server )
                .post( '/password-recoveries' )
                .send( fixtures )
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
        } );

        it( 'requires a POST body', function( done ){
            request( app.server )
                .post( '/password-recoveries' )
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
        } );

        it( 'wont create a new password recovery entry if there already is one', function( done ){
            var fixtures = {
                email: dbUtil.defaults.user.email
            };

            dbUtil.initPendingPasswordRecovery( function( err ){
                if( err ){
                    done( err );
                }
                else{
                    request( app.server )
                        .post( '/password-recoveries' )
                        .send( fixtures )
                        .set( 'Accept', 'application/json' )
                        .expect( 400 )
                        .end( function( err, res ){
                            if( err ){
                                console.error( res.body );
                                return done( err );
                            }
                            else{
                                PasswordRecovery.find( {}, function( err, result ){
                                    if( err ){
                                        done( err );
                                    }
                                    else{
                                        _.isEmpty( result ).should.be.equal( false );
                                        result.length.should.be.equal( 1 );
                                        result[0].should.have.property( 'status', 0 );
                                        result[0].should.have.property( 'user_id', mongoose.Types.ObjectId( dbUtil.defaults.user._id ) );
                                        done();
                                    }
                                } );
                            }
                        } );
                }
            } );
        } );

        it( 'will create a new password recovery entry if there already is one that is expired', function( done ){
            var fixtures = {
                email: dbUtil.defaults.user.email
            };

            dbUtil.initPendingExpiredPasswordRecovery( function( err ){
                if( err ){
                    done( err );
                }
                else{
                    request( app.server )
                        .post( '/password-recoveries' )
                        .send( fixtures )
                        .set( 'Accept', 'application/json' )
                        .expect( 201 )
                        .end( function( err, res ){
                            if( err ){
                                console.error( res.body );
                                return done( err );
                            }
                            else{
                                PasswordRecovery.find( {}, function( err, result ){
                                    if( err ){
                                        done( err );
                                    }
                                    else{
                                        _.isEmpty( result ).should.be.equal( false );
                                        result.length.should.be.equal( 2 );
                                        done();
                                    }
                                } );
                            }
                        } );
                }
            } );
        } );

        // END Describe POST /password-recoveries/
    } );

    // password-recoveries.validate
    describe( 'GET /password-recoveries/:key', function(){
        beforeEach( function( done ){
            dbUtil.clearDB( app, function( err ){
                if( err ){
                    done( err );
                }
                else{
                    dbUtil.initUser( function( err ){
                        if( err ){
                            done( err );
                        }
                        else{
                            dbUtil.initRegistration( function( err ){
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

        it( 'confirms there is an pending PasswordRecovery', function( done ){
            var fixtures = {
                email: dbUtil.defaults.user.email
            };

            dbUtil.initPendingPasswordRecovery( function( err ){
                if( err ){
                    done( err );
                }
                else{
                    request( app.server )
                        .get( '/password-recoveries/' + dbUtil.defaults.passwordRecovery.key )
                        .send( fixtures )
                        .set( 'Accept', 'application/json' )
                        .expect( 200 )
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

        it( 'wont confirm if the pending PasswordRecovery is expired', function( done ){
            var fixtures = {
                email: dbUtil.defaults.user.email
            };

            dbUtil.initPendingExpiredPasswordRecovery( function( err ){
                if( err ){
                    done( err );
                }
                else{
                    request( app.server )
                        .get( '/password-recoveries/' + dbUtil.defaults.passwordRecovery.key )
                        .send( fixtures )
                        .set( 'Accept', 'application/json' )
                        .expect( 404 )
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

        it( 'requires a valid key parameter', function( done ){
            var fixtures = {
                email: dbUtil.defaults.user.email
            };

            dbUtil.initPendingPasswordRecovery( function( err ){
                if( err ){
                    done( err );
                }
                else{
                    request( app.server )
                        .get( '/password-recoveries/notthecorrectkey' )
                        .send( fixtures )
                        .set( 'Accept', 'application/json' )
                        .expect( 404 )
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

        it( 'wont confirm if there is no PasswordRecovery', function( done ){
            var fixtures = {
                email: dbUtil.defaults.user.email
            };

            request( app.server )
                .get( '/password-recoveries/' + dbUtil.defaults.passwordRecovery.key )
                .send( fixtures )
                .set( 'Accept', 'application/json' )
                .expect( 404 )
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

        // END Describe GET /password-recoveries/:key
    } );

    // password-recoveries.updatePassword
    describe( 'PUT /password-recoveries', function(){
        beforeEach( function( done ){
            dbUtil.clearDB( app, function( err ){
                if( err ){
                    done( err );
                }
                else{
                    dbUtil.initUser( function( err ){
                        if( err ){
                            done( err );
                        }
                        else{
                            dbUtil.initRegistration( function( err ){
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

        it( 'changes the password if the key is correct and there is a pending PasswordRecovery', function( done ){
            var fixtures = {
                key: dbUtil.defaults.passwordRecovery.key,
                hash: 'newPassword'
            };

            dbUtil.initPendingPasswordRecovery( function( err ){
                if( err ){
                    done( err );
                }
                else{
                    request( app.server )
                        .put( '/password-recoveries' )
                        .send( fixtures )
                        .set( 'Accept', 'application/json' )
                        .expect( 201 )
                        .end( function( err, res ){
                            if( err ){
                                console.error( res.body );
                                return done( err );
                            }
                            else{

                                // The password recovery should be changed to status 1
                                PasswordRecovery.find( {}, function( err, passwordRecovery ){
                                    if( err ){
                                        done( err );
                                    }
                                    else{
                                        _.isEmpty( passwordRecovery ).should.be.equal( false );
                                        passwordRecovery.length.should.be.equal( 1 );
                                        passwordRecovery[0].should.have.property( 'status', 1 );
                                        passwordRecovery[0].should.have.property( 'user_id', mongoose.Types.ObjectId( dbUtil.defaults.user._id ) );

                                        // The user's password should be updated and usable to log in
                                        User.find( {}, function( err, user ){
                                            if( err ){
                                                done( err );
                                            }
                                            else{
                                                _.isEmpty( user ).should.be.equal( false );
                                                user.length.should.be.equal( 1 );
                                                user[0].should.have.property( '_id', mongoose.Types.ObjectId( dbUtil.defaults.user._id ) );
                                                bcrypt.compareSync( fixtures.hash, user[0].hash ).should.be.equal( true );
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

        it( 'wont change the password if the key is incorrect', function( done ){
            var fixtures = {
                key: 'not_the_right_key',
                hash: 'newPassword'
            };

            dbUtil.initPendingPasswordRecovery( function( err ){
                if( err ){
                    done( err );
                }
                else{
                    request( app.server )
                        .put( '/password-recoveries' )
                        .send( fixtures )
                        .set( 'Accept', 'application/json' )
                        .expect( 400 )
                        .end( function( err, res ){
                            if( err ){
                                console.error( res.body );
                                return done( err );
                            }
                            else{

                                // The password recovery should not be changed to status 1
                                PasswordRecovery.find( {}, function( err, passwordRecovery ){
                                    if( err ){
                                        done( err );
                                    }
                                    else{
                                        _.isEmpty( passwordRecovery ).should.be.equal( false );
                                        passwordRecovery.length.should.be.equal( 1 );
                                        passwordRecovery[0].should.have.property( 'status', 0 );
                                        passwordRecovery[0].should.have.property( 'user_id', mongoose.Types.ObjectId( dbUtil.defaults.user._id ) );

                                        // The user's password should not have changed
                                        User.find( {}, function( err, user ){
                                            if( err ){
                                                done( err );
                                            }
                                            else{
                                                _.isEmpty( user ).should.be.equal( false );
                                                user.length.should.be.equal( 1 );
                                                user[0].should.have.property( '_id', mongoose.Types.ObjectId( dbUtil.defaults.user._id ) );
                                                bcrypt.compareSync( fixtures.hash, user[0].hash ).should.be.equal( false );
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

        it( 'wont change the password pending PasswordRecovery is expired', function( done ){
            var fixtures = {
                key: dbUtil.defaults.passwordRecovery.key,
                hash: 'newPassword'
            };

            dbUtil.initPendingExpiredPasswordRecovery( function( err ){
                if( err ){
                    done( err );
                }
                else{
                    request( app.server )
                        .put( '/password-recoveries' )
                        .send( fixtures )
                        .set( 'Accept', 'application/json' )
                        .expect( 400 )
                        .end( function( err, res ){
                            if( err ){
                                console.error( res.body );
                                return done( err );
                            }
                            else{

                                // The password recovery should not be changed to status 1
                                PasswordRecovery.find( {}, function( err, passwordRecovery ){
                                    if( err ){
                                        done( err );
                                    }
                                    else{
                                        _.isEmpty( passwordRecovery ).should.be.equal( false );
                                        passwordRecovery.length.should.be.equal( 1 );
                                        passwordRecovery[0].should.have.property( 'status', 0 );
                                        passwordRecovery[0].should.have.property( 'user_id', mongoose.Types.ObjectId( dbUtil.defaults.user._id ) );

                                        // The user's password should not be changed
                                        User.find( {}, function( err, user ){
                                            if( err ){
                                                done( err );
                                            }
                                            else{
                                                _.isEmpty( user ).should.be.equal( false );
                                                user.length.should.be.equal( 1 );
                                                user[0].should.have.property( '_id', mongoose.Types.ObjectId( dbUtil.defaults.user._id ) );
                                                bcrypt.compareSync( fixtures.hash, user[0].hash ).should.be.equal( false );
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

        it( 'wont change the password if the PasswordRecovery is complete', function( done ){

            var fixtures = {
                key: dbUtil.defaults.passwordRecovery.key,
                hash: 'newPassword'
            };

            dbUtil.initCompletePasswordRecovery( function( err ){
                if( err ){
                    done( err );
                }
                else{
                    request( app.server )
                        .put( '/password-recoveries' )
                        .send( fixtures )
                        .set( 'Accept', 'application/json' )
                        .expect( 400 )
                        .end( function( err, res ){
                            if( err ){
                                console.error( res.body );
                                return done( err );
                            }
                            else{
                                User.find( {}, function( err, user ){
                                    if( err ){
                                        done( err );
                                    }
                                    else{
                                        _.isEmpty( user ).should.be.equal( false );
                                        user.length.should.be.equal( 1 );
                                        user[0].should.have.property( '_id', mongoose.Types.ObjectId( dbUtil.defaults.user._id ) );
                                        bcrypt.compareSync( fixtures.hash, user[0].hash ).should.be.equal( false );
                                        done();
                                    }
                                } );
                            }
                        } );
                }
            } );

        } );

        it( 'requires a hash parameter', function( done ){
            var fixtures = {
                key: dbUtil.defaults.passwordRecovery.key,
            };

            dbUtil.initPendingPasswordRecovery( function( err ){
                if( err ){
                    done( err );
                }
                else{
                    request( app.server )
                        .put( '/password-recoveries' )
                        .send( fixtures )
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

        it( 'requires a key parameter', function( done ){
            var fixtures = {
                hash: 'newPassword'
            };

            dbUtil.initPendingPasswordRecovery( function( err ){
                if( err ){
                    done( err );
                }
                else{
                    request( app.server )
                        .put( '/password-recoveries' )
                        .send( fixtures )
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

        it( 'requires a POST body', function( done ){

            dbUtil.initPendingPasswordRecovery( function( err ){
                if( err ){
                    done( err );
                }
                else{
                    request( app.server )
                        .put( '/password-recoveries' )
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

        // END Describe PUT /password-recoveries/
    } );

    // END password-recoveries controller
} );