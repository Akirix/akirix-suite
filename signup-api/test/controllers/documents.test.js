process.env.NODE_ENV = 'test';

var request = require( 'supertest' );
var mongoose = require( 'mongoose' );
var _ = require( 'lodash' );

var app = require( '../../app.js' );
var config = require( '../../config/config.json' );
var dbUtil = require( '../components/db-utilities.js' );
var Document = mongoose.model( 'Document' );

describe( 'documents', function(){

    // documents.create
    describe( 'POST /documents', function(){
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

        it( 'creates a document entry', function( done ){
            var fixtures = {
                document_type: 'primary_id',
                user_id: dbUtil.defaults.user._id
            };

            request( app.server )
                .post( '/documents' )
                .attach( 'file', __dirname + '/../components/files/test_file_png.png' )
                .field( 'user_id', fixtures.user_id )
                .field( 'document_type', fixtures.document_type )
                .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                .set( 'Accept', 'application/json' )
                .expect( 201 )
                .end( function( err, res ){
                    if( err ){
                        console.error( res.body );
                        return done( err );
                    }
                    else{
                        _.isEmpty( res.body ).should.be.equal( false );

                        res.body.should.have.property( 'user_id', dbUtil.defaults.user._id );
                        res.body.should.have.property( 'name', 'test_file_png.png' );
                        res.body.should.have.property( 'type', 'image/png' );

                        Document.find( {}, function( err, result ){
                            if( err ){
                                done( err );
                            }
                            else{
                                _.isEmpty( result ).should.be.equal( false );
                                result.length.should.be.equal( 1 );
                                result[0].should.have.property( 'user_id', mongoose.Types.ObjectId( dbUtil.defaults.user._id ) );

                                done();
                            }
                        } );
                    }
                } );
        } );

        it( 'requires authentication', function( done ){
            var fixtures = {
                document_type: 'primary_id',
                user_id: dbUtil.defaults.user._id
            };

            request( app.server )
                .post( '/documents' )
                .attach( 'file', __dirname + '/../components/files/test_file_png.png' )
                .field( 'user_id', fixtures.user_id )
                .field( 'document_type', fixtures.document_type )
                .set( 'Accept', 'application/json' )
                .expect( 401 )
                .end( function( err, res ){
                    if( err ){
                        console.error( res.body );
                        return done( err );
                    }
                    else{
                        Document.find( {}, function( err, result ){
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

        it( 'requires a document_type parameter', function( done ){
            var fixtures = {
                user_id: dbUtil.defaults.user._id
            };

            request( app.server )
                .post( '/documents' )
                .attach( 'file', __dirname + '/../components/files/test_file_png.png' )
                .field( 'user_id', fixtures.user_id )
                .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                .set( 'Accept', 'application/json' )
                .expect( 400 )
                .end( function( err, res ){
                    if( err ){
                        console.error( res.body );
                        return done( err );
                    }
                    else{
                        Document.find( {}, function( err, result ){
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

        it( 'requires a POST body', function( done ){

            request( app.server )
                .post( '/documents' )
                .attach( 'file', __dirname + '/../components/files/test_file_png.png' )
                .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                .set( 'Accept', 'application/json' )
                .expect( 400 )
                .end( function( err, res ){
                    if( err ){
                        console.error( res.body );
                        return done( err );
                    }
                    else{
                        Document.find( {}, function( err, result ){
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

        it( 'requires the submitted user_id to match the session_id', function( done ){
            var fixtures = {
                document_type: 'primary_id',
                user_id: 'notauserid'
            };

            request( app.server )
                .post( '/documents' )
                .attach( 'file', __dirname + '/../components/files/test_file_png.png' )
                .field( 'user_id', fixtures.user_id )
                .field( 'document_type', fixtures.document_type )
                .set( 'Accept', 'application/json' )
                .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                .expect( 401 )
                .end( function( err, res ){
                    if( err ){
                        console.error( res.body );
                        return done( err );
                    }
                    else{
                        Document.find( {}, function( err, result ){
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

        it( 'does not accept .zip files', function( done ){
            var fixtures = {
                document_type: 'primary_id',
                user_id: dbUtil.defaults.user._id
            };

            request( app.server )
                .post( '/documents' )
                .attach( 'file', __dirname + '/../components/files/test_file_zip.zip' )
                .field( 'user_id', fixtures.user_id )
                .field( 'document_type', fixtures.document_type )
                .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                .set( 'Accept', 'application/json' )
                .expect( 400 )
                .end( function( err, res ){
                    if( err ){
                        console.error( res.body );
                        return done( err );
                    }
                    else{
                        Document.find( {}, function( err, result ){
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

        it( 'does not accept .docx files', function( done ){
            var fixtures = {
                document_type: 'primary_id',
                user_id: dbUtil.defaults.user._id
            };

            request( app.server )
                .post( '/documents' )
                .attach( 'file', __dirname + '/../components/files/test_file_docx.docx' )
                .field( 'user_id', fixtures.user_id )
                .field( 'document_type', fixtures.document_type )
                .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                .set( 'Accept', 'application/json' )
                .expect( 400 )
                .end( function( err, res ){
                    if( err ){
                        console.error( res.body );
                        return done( err );
                    }
                    else{
                        Document.find( {}, function( err, result ){
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

        // END Describe POST /documents
    } );

    // END documents controller
} );