import Ember from 'ember';
import config from 'uber-app/config/environment';

export default Ember.View.extend( {
    templateName: 'views/signup-document-upload',
    url: config.APP.uber_api_host + '/signupDocuments',
    acceptedFiles: [ 'image/gif', 'image/jpeg', 'image/pjpeg', 'application/pdf', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel' ],
    maxFileSize: 50000000,

    init: function(){
        this._super();
        this.set( 'fileQueue', [] );
    },

    didInsertElement: function(){
        this._super();
        Ember.run.scheduleOnce( 'afterRender', this, this.afterRenderEvent );
    },

    afterRenderEvent: function(){
        var _this = this;
        var documentType = _this.get( 'documentType' );
        var fileQueue = _this.get( 'fileQueue' );

        var documents = _this.get( 'parentView.controller.content.documents' );
        var user_id = _this.get( 'parentView.controller.session.user_id' );

        var parentElement = _this.$();
        var uploadElement = parentElement.find( 'div.upload-area' );

        var uploader = parentElement.fileupload( {
            url: _this.get( 'url' ),
            type: 'POST',
            dataType: 'json',
            sequentialUploads: true,
            dropZone: uploadElement,
            fileInput: uploadElement,
            paramName: 'file',
            add: function( e, data ){
                var notify = _this.get( 'controller.notify' );

                if( !Ember.isEmpty( data.files[ 0 ] ) ){

                    var acceptedFiles = _this.get( 'acceptedFiles' );
                    if( acceptedFiles.contains( data.files[ 0 ][ 'type' ] ) ){
                        var maxFileSize = _this.get( 'maxFileSize' );

                        if( data.files[ 0 ][ 'size' ] <= maxFileSize ){
                            _this.send( 'addFile', data );
                        }
                        // File size too large
                        else{
                            Ember.Logger.log( 'File size too large' );
                            var filesizeMG = maxFileSize / 1000000;
                            notify.alert( 'File size too large ( Max file size ' + filesizeMG + 'MB )', {
                                closeAfter: null
                            } );
                            data.abort();
                        }

                    }
                    else{
                        Ember.Logger.log( 'Not accepted file type' );
                        // File type invalid
                        notify.alert( 'File ' + data.files[0]['name'] + ' invalid file type', {
                            closeAfter: null
                        } );
                        data.abort();
                    }
                }
                else{
                    Ember.Logger.log( 'No file info' );
                    notify.alert( { raw: config.messages.update_error, closeAfter: null } );
                }
            },
            fail: function( e, data ){
                var notify = _this.get( 'controller.notify' );
                if( data.hasOwnProperty( 'jqXHR' ) && data.jqXHR.hasOwnProperty( 'status' ) ){
                    notify.alert( { raw: config.messages.update_error, closeAfter: null } );
                }
            },
            progress: function( e, data ){
                var progress = parseInt( data.loaded / data.total * 100, 10 );
                Ember.set( data.files[ 0 ], 'progress', progress );
                Ember.set( data.files[ 0 ], 'style', 'width: ' + progress + '%;' );
            }
        } );
    },

    actions: {
        addFile: function( fileData ){
            var _this = this;
            var fileQueue = _this.get( 'fileQueue' );

            fileData.style = 'width: 0%;';
            fileData.progress = 0;
            fileData.documentType = null;
            fileData.name = fileData.files[ 0 ].name;
            fileData.type = fileData.files[ 0 ].type;

            fileQueue.pushObject( fileData );
        },
        upload: function(){
            var _this = this;
            var fileQueue = _this.get( 'fileQueue' );
            var controller = _this.get( 'parentView.controller' );
            var registration = _this.get( 'registration' );
            var akxUtil = _this.get( 'parentView.controller.akxUtil' );

            // Validate
            var valid = true;
            fileQueue.forEach( function( file ){
                if( Ember.isEmpty( file.documentType ) ){
                    valid = false;
                }
            } );

            if( valid ){
                fileQueue.forEach( function( file ){
                    file.formData = {
                        document_type: file.documentType,
                        user_id: registration.user_id,
                        registration_id: registration._id
                    };

                    file.submit()
                        .success( function( result, textStatus, jqXHR ){
                            var registrationDocument = {
                                document_id: result._id,
                                document_type: result.document_type,
                                name: result.name,
                                type: result.type
                            };

                            akxUtil._sendRequest( '/signupRegistrations/' + registration._id + '/createDocument', 'post', registrationDocument ).then( function( result ){
                                fileQueue.removeObject( file );
                                controller.send( 'reloadRegistrationModel' );
                            }, function(){

                            } );
                        } );
                } );
            }
        },
        remove: function( document ){
            var _this = this;
            var fileQueue = _this.get( 'fileQueue' );
            fileQueue.removeObject( document );
        }
    }
} );
