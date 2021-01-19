import Ember from 'ember';
import config from 'signup-app/config/environment';

export default Ember.View.extend( {
    acceptedFiles: [ 'image/gif', 'image/jpeg', 'image/pjpeg', 'application/pdf', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel' ],
    maxFileSize: 5000000,
    templateName: 'views/document-upload',
    url: config.APP.signup_api_host + '/documents',
    classNames: [ 'document-upload', 'animated', 'flipInX' ],
    dropzone: null,
    documentTypeBinding: 'controller.documentType',
    documentsBinding: 'controller.documents',
    registrationBinding: 'parentView.controller.model',

    init: function(){
        this._super();
        this.fileQueue = [];
        this.validated = false;
    },

    didInsertElement: function(){
        this._super();
        Ember.run.scheduleOnce( 'afterRender', this, this.afterRenderEvent );
    },

    afterRenderEvent: function(){
        var _this = this;
        var notify = _this.get( 'controller.notify' );
        var documentType = _this.get( 'documentType' );
        var fileQueue = _this.get( 'fileQueue' );
        var documents = _this.get( 'documents' );
        var user_id = _this.get( 'parentView.controller.session.user._id' );
        var acceptedFiles = _this.get( 'acceptedFiles' );
        var maxFileSize = _this.get( 'maxFileSize' );
        var element = _this.$();
        var dropzoneElement = _this.get( 'dropzone' );

        var fileUploadOptions = {
            url: _this.get( 'url' ),
            type: 'POST',
            dataType: 'json',
            sequentialUploads: true,
            fileInput: element,
            paramName: 'file',
            formData: {
                document_type: documentType.name,
                user_id: user_id
            },
            add: function( e, data ){
                Ember.Logger.log( 'Added File' );

                if( Ember.isEmpty( data.files[ 0 ] ) ){
                    // Missing File
                    Ember.Logger.log( 'Added File' );
                    notify.alert( { raw: config.messages.update_error } );
                }
                else if( !acceptedFiles.contains( data.files[ 0 ][ 'type' ] ) ){
                    // File type invalid
                    notify.alert( 'File ' + data.files[ 0 ][ 'name' ] + ' invalid file type', {
                        closeAfter: 5000
                    } );
                    data.abort();
                }
                else if( data.files[ 0 ][ 'size' ] > maxFileSize ){
                    // File size too large
                    var filesizeMG = maxFileSize / 1000000;
                    notify.alert( 'File size too large ( Max file size ' + filesizeMG + 'MB )' );
                    data.abort();
                }
                else{
                    // Valid
                    data.files[ 0 ][ 'progress' ] = 0;
                    data.files[ 0 ].uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, function( c ){
                        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                        return v.toString( 16 );
                    } );

                    fileQueue.pushObject( data.files[ 0 ] );
                    data.submit();
                }
            },
            fail: function( e, data ){
                if( data.errorThrown !== 'abort' ){
                    notify.alert( { raw: config.messages.update_error, closeAfter: null } );
                }
            },
            always: function( e, data ){
                Ember.run.schedule( 'sync', _this, function(){
                    fileQueue = _this.get( 'fileQueue' );
                    _this.set( 'fileQueue', fileQueue.rejectBy( 'uuid', data.files[ 0 ].uuid ) );
                } );
            },
            done: function( e, data ){
                _this.send( 'updateRegistration', data.result );
            },
            progress: function( e, data ){
                var progress = parseInt( data.loaded / data.total * 100, 10 );
                Ember.set( data.files[ 0 ], 'progress', progress );
            }
        };

        var uploader = element.fileupload( fileUploadOptions );
    },

    actions: {
        updateRegistration: function( fileData ){
            var _this = this;
            var adapter = this.get( 'parentView.controller.akxAdapter' );
            var registration = this.get( 'parentView.controller.model' );
            var documentType = this.get( 'documentType' );
            var notify = _this.get( 'controller.notify' );

            var registrationData = {
                document_id: fileData._id,
                document_type: fileData.document_type,
                name: fileData.name,
                type: fileData.type
            };

            adapter.sendRequest( '/registrations/' + registration._id + '/documents', 'post', registrationData )
                .then( function( result ){
                    Ember.run.schedule( 'sync', _this, function(){
                        registration.documents.pushObject( result.data );
                        registration.notifyPropertyChange( 'documents' );
                    } );
                } )
                .catch( function(){
                    notify.alert( { raw: config.messages.update_error, closeAfter: null } );
                } );
        }
    }
} );
