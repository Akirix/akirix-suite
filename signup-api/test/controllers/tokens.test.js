process.env.NODE_ENV = 'test';

var request = require( 'supertest' );
var mongoose = require( 'mongoose' );
var _ = require( 'lodash' );

var app = require( '../../app.js' );
var config = require( '../../config/config.json' );
var dbUtil = require( '../components/db-utilities.js' );
var Token = mongoose.model( 'Token' );
var User = mongoose.model( 'User' );
var bcrypt = require( 'bcrypt' );
var jwt = require( 'jwt-simple' );
var secretConfig = require( '../../config/config.json' ).secrets;

describe( 'tokens', function(){

    // tokens.login
    describe( 'POST /token', function(){
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

        it( 'creates a token for a successful login', function( done ){
            var fixtures = {
                email: dbUtil.defaults.user.email,
                hash: dbUtil.defaults.user.hash
            };

            request( app.server )
                .post( '/token' )
                .send( fixtures )
                .set( 'Accept', 'application/json' )
                .expect( 201 )
                .end( function( err, res ){
                    if( err ){
                        console.error( res.body );
                        return done( err );
                    }
                    else{
                        Token.find( {}, function( err, result ){
                            if( err ){
                                done( err );
                            }
                            else{
                                _.isEmpty( result ).should.be.equal( false );
                                result.length.should.be.equal( 1 );
                                result[0].should.have.property( 'data' );

                                var decoded = jwt.decode( result[0].data, secretConfig );
                                decoded.should.have.property( 'email', dbUtil.defaults.user.email );
                                decoded.should.have.property( '_id', dbUtil.defaults.user._id );
                                decoded.should.have.property( 'ip', dbUtil.defaults.registration.ip );

                                done();
                            }
                        } );
                    }
                } );
        } );

        it( 'requires an email param', function( done ){
            var fixtures = {
                hash: dbUtil.defaults.user.hash
            };

            request( app.server )
                .post( '/token' )
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

        it( 'requires an hash param', function( done ){
            var fixtures = {
                email: dbUtil.defaults.user.email,
            };

            request( app.server )
                .post( '/token' )
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
                .post( '/token' )
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

        it( 'does not create a token for a bad password', function( done ){
            var fixtures = {
                email: dbUtil.defaults.user.email,
                hash: 'wrong_password'
            };

            request( app.server )
                .post( '/token' )
                .send( fixtures )
                .set( 'Accept', 'application/json' )
                .expect( 400 )
                .end( function( err, res ){
                    if( err ){
                        console.error( res.body );
                        return done( err );
                    }
                    else{
                        Token.find( {}, function( err, result ){
                            if( err ){
                                done( err );
                            }
                            else{
                                result.length.should.be.equal( 0 );
                                done();
                            }
                        } );
                    }
                } );
        } );

        it( 'does not create a token for a bad email', function( done ){
            var fixtures = {
                email: 'nathan@',
                hash: dbUtil.defaults.user.hash
            };

            request( app.server )
                .post( '/token' )
                .send( fixtures )
                .set( 'Accept', 'application/json' )
                .expect( 400 )
                .end( function( err, res ){
                    if( err ){
                        console.error( res.body );
                        return done( err );
                    }
                    else{
                        Token.find( {}, function( err, result ){
                            if( err ){
                                done( err );
                            }
                            else{
                                result.length.should.be.equal( 0 );
                                done();
                            }
                        } );
                    }
                } );
        } );

        // END POST /token
    } );

    // tokens.logout
    describe( 'POST /logout', function(){
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

        it( 'removes the token', function( done ){
            request( app.server )
                .post( '/logout' )
                .set( 'Accept', 'application/json' )
                .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                .expect( 200 )
                .end( function( err, res ){
                    if( err ){
                        console.error( res.body );
                        return done( err );
                    }
                    else{
                        res.body.should.be.empty;
                        Token.find( {}, function( err, result ){
                            if( err ){
                                done( err );
                            }
                            else{
                                result.length.should.be.equal( 0 );
                                done();
                            }
                        } );
                    }
                } );
        } );

        it( 'requires authentication', function( done ){
            request( app.server )
                .post( '/logout' )
                .set( 'Accept', 'application/json' )
                .expect( 401 )
                .end( function( err, res ){
                    if( err ){
                        console.error( res.body );
                        return done( err );
                    }
                    else{
                        Token.find( {}, function( err, result ){
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
        } );
        // END POST /logout
    } );

    // tokens.renew
    describe( 'POST /tokens/renew', function(){
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

        it( 'updates the token\'s expires field', function( done ){
            var moment = require( 'moment-timezone' );
            var ttl = 60;
            var expDate = moment.utc().add( ttl, 'seconds' );
            var formattedExpDate = expDate.format();

            Token.update( {_id: dbUtil.defaults.token._id}, { $set: { expires: formattedExpDate } }, function( err, numberAffected ){
                if( err ){
                    done( err );
                }
                else{
                    numberAffected.should.be.equal( 1 );

                    request( app.server )
                        .post( '/tokens/renew' )
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
                                res.body.should.have.property( 'token' );
                                res.body.should.have.property( 'ttl' );

                                Token.find( {}, function( err, result ){
                                    if( err ){
                                        done( err );
                                    }
                                    else{

                                        result.length.should.be.equal( 1 );
                                        res.body.token.should.have.property( 'data', result[0].data );

                                        res.body.token.should.have.property( 'expires' );

                                        var newDate = moment( res.body.token.expires );
                                        newDate.format().should.equal( moment( result[0].expires ).format() );

                                        var dateFormat = 'MM/DD/YYYY HH:mm:ss';
                                        var diff = newDate.diff( expDate );

                                        // Check to make sure the increase is about 24 hours (approx given processing time variance)
                                        diff.should.be.greaterThan( 84600000 ); //23.5 hours
                                        diff.should.be.lessThan( 86400000 ); // 24 Hours

                                        done();
                                    }
                                } );
                            }
                        } );
                }
            } );
        } );

        it( 'should not update expired tokens', function( done ){
            var moment = require( 'moment-timezone' );
            var ttl = 60;
            var expDate = moment.utc().subtract( ttl, 'seconds' );
            var formattedExpDate = expDate.format();

            Token.update( {_id: dbUtil.defaults.token._id}, { $set: { expires: formattedExpDate } }, function( err, numberAffected ){
                if( err ){
                    done( err );
                }
                else{
                    numberAffected.should.be.equal( 1 );

                    request( app.server )
                        .post( '/tokens/renew' )
                        .set( 'Accept', 'application/json' )
                        .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
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
                }
            } );
        } );

        // END POST /tokens/renew
    } );

    // END tokens controller
} );