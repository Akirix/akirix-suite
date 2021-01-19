process.env.NODE_ENV = 'test';

var request = require( 'supertest' );
var mongoose = require( 'mongoose' );
var _ = require( 'lodash' );

var app = require( '../../app.js' );
var config = require( '../../config/config.json' );
var dbUtil = require( '../components/db-utilities.js' );
var DocumentType = mongoose.model( 'DocumentType' );

describe( 'document-types', function(){

    // document-types.get
    describe( 'GET /document-types:account_type', function(){
        beforeEach( function( done ){
            dbUtil.clearDB( app, function( err ){
                if( err ){
                    done( err );
                }
                else{
                    dbUtil.initDocumentTypes( function( err ){
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

        it( 'returns a list of document-types', function( done ){
            var fixtures = {
                email: dbUtil.defaults.user.email
            };

            request( app.server )
                .get( '/document-types/' + dbUtil.defaults.registration.account_type )
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

                        DocumentType.count( { account_type: dbUtil.defaults.registration.account_type }, function( err, result ){
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
            var fixtures = {
                email: dbUtil.defaults.user.email
            };

            request( app.server )
                .get( '/document-types/' + dbUtil.defaults.registration.account_type )
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

        // END Describe GET /document-types:account_type
    } );

    // END document-types controller
} );