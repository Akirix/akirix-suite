import Ember from 'ember';
import config from 'akx-app/config/environment';

export default Ember.Component.extend( {
    session: Ember.inject.service(),
    classNames: [ 'document-uploader', 'text-center' ],
    store: Ember.inject.service(),
    notify: Ember.inject.service(),
    attributeBindings: ['name'],

    setDefaults: function(){
        this.set( 'stringList', this.get( 'localeFile.upload-document' ) );
        this.set( 'acceptedMimeTypes', [
          'text/plain',                                                                 // .txt
          'text/csv',                                                                   // .csv
          'application/pdf',                                                            // .pdf
          'application/msword',                                                         // .doc
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',    // .docx
          'application/vnd.ms-excel',                                                   // .xls
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',          // .xlsx
          'image/jpg',                                                                  // .jpg
          'image/jpeg',                                                                 // .jpeg
          'image/png',                                                                  // .png
          'image/gif',                                                                  // .gif
          'image/svg+xml'                                                               // .svg
        ]);
    }.on( 'init' ),

    getToken: function(){
        return this.get( 'session.data.authenticated.access_token' );
    }.property(),

    actions: {
        uploadDocument( file ){
            let uploadErrors = [];
            // let acceptFileTypes = /(\.|\/)(gif|jpe?g|svg|png|pdf|xls|csv|xlsx|doc|docx|txt)$/i;

            if( Ember.isEmpty( file.blob[ 'type' ] ) || !this.get( 'acceptedMimeTypes' ).contains( file.blob[ 'type' ] ) ){
                uploadErrors.push( 'Unsupported file type.' );
            }

            if( file.blob[ 'size' ].length && file.blob[ 'size' ] > 5000000 ){
                uploadErrors.push( 'File size is too big' );
            }

            if( uploadErrors.length > 0 ){
                this.get( 'notify' ).error( uploadErrors.join( "\n" ), {
                    classNames: [ 'bg-danger' ]
                } );
            }
            else {
                let data = { model: this.get( 'model' ) };
                let headers = {};
                if( Ember.isEmpty( this.get( 'model_id' ) ) ){
                    data[ 'status' ] = 0;
                }
                else{
                    data[ 'model_id' ] = this.get( 'model_id' );
                    data[ 'status' ] = 1;
                }
                this.get( 'session' ).authorize( 'authorizer:oauth2', ( headerName, headerValue ) =>{
                    headers[ headerName ] = headerValue;
                } );
                file.upload( config.APP.api_host + '/documents', {
                    headers: headers,
                    accepts: [ 'application/json' ],
                    acceptFileTypes: /(\.|\/)(gif|jpe?g|svg|png|pdf|xls|csv|xlsx|doc|docx|txt)$/i,
                    fileKey: 'newDocument',
                    data: data
                } ).then( ( res )=>{
                    this.get( 'store' ).pushPayload( 'document', {
                        documents: [ res.body.document ]
                    } );
                    this.get( 'store' ).findRecord( 'document', res.body.document.id ).then( ( doc )=>{
                        this.get( 'documents' ).pushObject( doc );
                    } );
                } ).catch( ( err )=>{
                    let errorsObj = {
                        errors: {
                            status: err.status
                        }
                    };
                    if( err.responseJSON ){
                        errorsObj.errors[ 'errors' ] = err.responseJSON.errors;
                    }
                    this.sendAction( 'error', errorsObj );
                } );
            }
        },
        removeDocument( doc ){
            doc.destroyRecord();
            this.get( 'documents' ).removeObject( doc );
        },
        download( item ){
            let url = `${item.get('url_download')}?token=${this.get( 'getToken' )}`
            window.open( url, '_self', false );
        }
    }
} );
