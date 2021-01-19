process.env.NODE_ENV = 'test';

var request = require( 'supertest' );
var mongoose = require( 'mongoose' );
var _ = require( 'lodash' );

var app = require( '../../app.js' );
var Registration = mongoose.model( 'Registration' );
var dbUtil = require( '../components/db-utilities.js' );

describe( 'registrations', function(){

    // registrations.update
    describe( 'PUT /registrations/:registration_id', function(){
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
            var registration = _.clone( dbUtil.defaults.registration );

            request( app.server )
                .put( '/registrations/' + dbUtil.defaults.registration_id )
                .send( registration )
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

        it( 'updates the registration', function( done ){

            var fixtures = {
                status: 2,
                created: new Date( '01/01/1981' ),
                user_id: mongoose.Types.ObjectId( '12345678901234567890112a' ),
                _id: mongoose.Types.ObjectId( '12345678901234567890112b' ),
                first_name: 'Jim',
                last_name: 'Beam'
            };

            var registration = _.clone( dbUtil.defaults.registration );

            registration['user']['first_name'] = fixtures.first_name;
            registration['user']['last_name'] = fixtures.last_name;
            registration.status = fixtures.status;
            registration.created = fixtures.created;
            registration.user_id = fixtures.user_id;
            registration._id = fixtures._id;

            request( app.server )
                .put( '/registrations/' + dbUtil.defaults.registration._id )
                .send( registration )
                .set( 'Accept', 'application/json' )
                .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                .expect( 201 )
                .end( function( err, res ){
                    if( err ){
                        console.error( res.body );
                        return done( err );
                    }
                    else{
                        _.isEmpty( res.body ).should.be.false;
                        _.isEmpty( res.body.registration ).should.be.false;

                        // What you should be able to change
                        res.body.registration['user']['first_name'].should.be.equal( fixtures.first_name );
                        res.body.registration['user']['last_name'].should.be.equal( fixtures.last_name );

                        // What you shouldn't be able to change
                        res.body.registration['status'].should.not.be.equal( fixtures.status );
                        res.body.registration['_id'].should.not.be.equal( fixtures._id );
                        res.body.registration['user_id'].should.not.be.equal( fixtures.user_id );
                        res.body.registration['created'].should.not.be.equal( fixtures.created );
                        done();
                    }
                } );
        } );

        it( 'requires a POST body', function( done ){

            var registration = _.clone( dbUtil.defaults.registration );

            request( app.server )
                .put( '/registrations/' + dbUtil.defaults.registration._id )
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

        it( 'wont update completed registrations', function( done ){

            // Change the fixture registration to status 1 (complete)
            Registration.update( { _id: dbUtil.defaults.registration._id }, { $set: { status: 1 } }, function( err, numberAffected ){
                if( err ){
                    done( err );
                }
                else{
                    var registration = _.clone( dbUtil.defaults.registration );
                    request( app.server )
                        .put( '/registrations/' + dbUtil.defaults.registration._id )
                        .send( registration )
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
                }
            } );
        } );

        // END Describe PUT /registrations/:registration_id
    } );

    // registrations.complete
    describe( 'PUT /registrations/:registration_id/complete', function(){
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

            var registration = _.clone( dbUtil.defaults.registration );
            request( app.server )
                .put( '/registrations/' + dbUtil.defaults.registration_id + '/complete' )
                .send( registration )
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

        it( 'changes the status of the registration to 1', function( done ){
            var registration = _.clone( dbUtil.defaults.registration );

            registration.status.should.be.equal( 0 );

            request( app.server )
                .put( '/registrations/' + dbUtil.defaults.registration._id + '/complete' )
                .send( registration )
                .set( 'Accept', 'application/json' )
                .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                .expect( 201 )
                .end( function( err, res ){
                    if( err ){
                        console.error( res.body );
                        return done( err );
                    }
                    else{
                        Registration.findOne( { _id: dbUtil.defaults.registration._id }, function( err, result ){
                            if( err ){
                                done( err );
                            }
                            else{
                                _.isEmpty( result ).should.be.equal( false );
                                result.status.should.be.equal( 1 );
                                done();
                            }
                        } );
                    }
                } );
        } );

        // END Describe PUT /registrations/:registration_id/complete
    } );

    // registrations.createDocument
    describe( 'POST /registrations/:registration_id/documents', function(){
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
            var oldDate = new Date( '01/01/1981' );
            var fixture = {
                document: {
                    "document_id": "542c51d8ecd35b069b875647",
                    "document_type": "corporate_documents",
                    "name": "documentnstuff.gif",
                    "type": "image/gif",
                    "status": 2,
                    "exemption_reason": null,
                    "exemption": false,
                    "verified_date": oldDate,
                    "verified_user_id": null,
                    "verified": true,
                    "notes": "Something that shouldn't be there"
                }
            };

            request( app.server )
                .post( '/registrations/' + dbUtil.defaults.registration_id + '/documents' )
                .send( fixture.document )
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

        it( 'adds a document entry to the registration', function( done ){
            var registration = _.clone( dbUtil.defaults.registration );
            var documentCount = registration.documents.length;
            var oldDate = new Date( '01/01/1981' );

            var fixture = {
                document: {
                    "document_id": "542c51d8ecd35b069b875647",
                    "document_type": "corporate_documents",
                    "name": "documentnstuff.gif",
                    "type": "image/gif",
                    "status": 2,
                    "verified_date": oldDate,
                    "verified_user_id": null,
                    "verified": true,
                    "notes": "Something that shouldn't be there"
                }
            };

            request( app.server )
                .post( '/registrations/' + dbUtil.defaults.registration._id + '/documents' )
                .send( fixture.document )
                .set( 'Accept', 'application/json' )
                .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                .expect( 201 )
                .end( function( err, res ){
                    if( err ){
                        console.error( res.body );
                        return done( err );
                    }
                    else{
                        Registration.findOne( { _id: dbUtil.defaults.registration._id }, function( err, result ){
                            if( err ){
                                done( err );
                            }
                            else{
                                _.isEmpty( result ).should.be.equal( false );
                                result.documents.length.should.be.equal( documentCount + 1 );

                                var newDocumentIndex = _.findIndex( result.documents, { name: fixture.document.name } );
                                var newDocument = result.documents[ newDocumentIndex ];

                                newDocument.verified.should.be.equal( false );
                                ( newDocument.verified_user_id === null ).should.be.equal( true );
                                ( newDocument.verified_date === null ).should.be.equal( true );
                                ( newDocument.notes === null ).should.be.equal( true );
                                newDocument.status.should.be.equal( 1 );

                                done();
                            }
                        } );
                    }
                } );
        } );

        it( 'requires a document param', function( done ){
            request( app.server )
                .post( '/registrations/' + dbUtil.defaults.registration._id + '/documents' )
                .send( {} )
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

        it( 'requires a document.document_id param', function( done ){
            var registration = _.clone( dbUtil.defaults.registration );
            var documentCount = registration.documents.length;
            var oldDate = new Date( '01/01/1981' );

            var fixture = {
                document: {
                    "document_type": "corporate_documents",
                    "name": "documentnstuff.gif",
                    "type": "image/gif",
                    "status": 2,
                    "exemption_reason": null,
                    "exemption": false,
                    "verified_date": oldDate,
                    "verified_user_id": null,
                    "verified": true,
                    "notes": "Something that shouldn't be there"
                }
            };

            request( app.server )
                .post( '/registrations/' + dbUtil.defaults.registration._id + '/documents' )
                .send( fixture.document )
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

        it( 'requires a document.document_type param', function( done ){
            var registration = _.clone( dbUtil.defaults.registration );
            var documentCount = registration.documents.length;
            var oldDate = new Date( '01/01/1981' );

            var fixture = {
                document: {
                    "document_id": "542c51d8ecd35b069b875647",
                    "name": "documentnstuff.gif",
                    "type": "image/gif",
                    "status": 2,
                    "verified_date": oldDate,
                    "verified_user_id": null,
                    "verified": true,
                    "notes": "Something that shouldn't be there"
                }
            };

            request( app.server )
                .post( '/registrations/' + dbUtil.defaults.registration._id + '/documents' )
                .send( fixture.document )
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

        it( 'requires a document.name param', function( done ){
            var registration = _.clone( dbUtil.defaults.registration );
            var documentCount = registration.documents.length;
            var oldDate = new Date( '01/01/1981' );

            var fixture = {
                document: {
                    "document_id": "542c51d8ecd35b069b875647",
                    "document_type": "corporate_documents",
                    "type": "image/gif",
                    "status": 2,
                    "verified_date": oldDate,
                    "verified_user_id": null,
                    "verified": true,
                    "notes": "Something that shouldn't be there"
                }
            };

            request( app.server )
                .post( '/registrations/' + dbUtil.defaults.registration._id + '/documents' )
                .send( fixture.document )
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

        it( 'requires a document.type param', function( done ){
            var registration = _.clone( dbUtil.defaults.registration );
            var documentCount = registration.documents.length;
            var oldDate = new Date( '01/01/1981' );

            var fixture = {
                document: {
                    "document_id": "542c51d8ecd35b069b875647",
                    "document_type": "corporate_documents",
                    "name": "documentnstuff.gif",
                    "status": 2,
                    "verified_date": oldDate,
                    "verified_user_id": null,
                    "verified": true,
                    "notes": "Something that shouldn't be there"
                }
            };

            request( app.server )
                .post( '/registrations/' + dbUtil.defaults.registration._id + '/documents' )
                .send( fixture.document )
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

        // END Describe POST /registrations/:registration_id/documents
    } );

    // registrations.removeDocument
    describe( 'PUT /registrations/:registration_id/documents/:sub_document_id', function(){
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
            var document_id = dbUtil.defaults.registration.documents[0]._id;

            request( app.server )
                .del( '/registrations/' + dbUtil.defaults.registration._id + '/documents/' + document_id )
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

        it( 'changes a document\'s status to 0 entry in the registration', function( done ){
            var document_id = dbUtil.defaults.registration.documents[0]._id;

            request( app.server )
                .del( '/registrations/' + dbUtil.defaults.registration._id + '/documents/' + document_id )
                .set( 'Accept', 'application/json' )
                .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                .expect( 200 )
                .end( function( err, res ){
                    if( err ){
                        console.error( res.body );
                        return done( err );
                    }
                    else{
                        Registration.findOne( { _id: dbUtil.defaults.registration._id }, function( err, result ){
                            if( err ){
                                done( err );
                            }
                            else{
                                _.isEmpty( result ).should.be.equal( false );

                                var changedDocumentIndex = _.findIndex( result.documents, { _id: mongoose.Types.ObjectId( document_id ) } );
                                var changedDocument = result.documents[ changedDocumentIndex ];
                                changedDocument.status.should.be.equal( 0 );

                                done();
                            }
                        } );
                    }
                } );
        } );

        // END Describe PUT /registrations/:registration_id/documents/:sub_document_id
    } );

    // registrations.updateDocument
    describe( 'PUT /registrations/:registration_id/documents/:sub_document_id', function(){
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
            var document = _.clone( dbUtil.defaults.registration.documents[0] );

            document.name = "somethingentirelydifferent.gif";

            request( app.server )
                .put( '/registrations/' + dbUtil.defaults.registration._id + '/documents/' + document._id )
                .send( document )
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

        it( 'updates a document entry in the registration', function( done ){
            var document = _.clone( dbUtil.defaults.registration.documents[0] );

            document.name = "somethingentirelydifferent.gif";
            document.status = 2;
            document.notes = "somethingentirelydifferent";
            document.verified = true;
            document.verified_user_id = "1234567890";
            document.verified_date = new Date();

            request( app.server )
                .put( '/registrations/' + dbUtil.defaults.registration._id + '/documents/' + document._id )
                .send( document )
                .set( 'Accept', 'application/json' )
                .set( 'Authorization', 'Bearer ' + dbUtil.defaults.accessToken )
                .expect( 201 )
                .end( function( err, res ){
                    if( err ){
                        console.error( res.body );
                        return done( err );
                    }
                    else{
                        Registration.findOne( { _id: dbUtil.defaults.registration._id }, function( err, result ){
                            if( err ){
                                done( err );
                            }
                            else{
                                _.isEmpty( result ).should.be.equal( false );

                                var changedDocumentIndex = _.findIndex( result.documents, { name: document.name } );
                                var changedDocument = result.documents[ changedDocumentIndex ];

                                changedDocument.name.should.be.equal( document.name );
                                changedDocument.status.should.be.equal( 1 );
                                changedDocument.verified.should.be.equal( false );
                                ( changedDocument.verified_user_id === null ).should.be.equal( true );
                                ( changedDocument.verified_date === null ).should.be.equal( true );
                                ( changedDocument.notes === null ).should.be.equal( true );

                                done();
                            }
                        } );
                    }
                } );
        } );

        // END Describe PUT /registrations/:registration_id/documents/:sub_document_id
    } );

    // END registrations controller
} );