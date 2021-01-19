import Ember from 'ember';
import config from 'uber-app/config/environment';

export default Ember.Component.extend( {
    acceptedFiles: [ 'image/gif', 'image/jpeg', 'image/pjpeg', 'application/pdf', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel' ],
    maxFileSize: 50000000,
    fileQueue: Ember.A(),

    didInsertElement: function(){
        var _this = this;
        var url = this.get( 'url' );

        this.$().fileupload( {
            url: url,
            type: 'POST',
            dataType: 'json',
            sequentialUploads: true,
            dropZone: false,
            paramName: 'newDocument',
            add: function( e, data ){
                var notify = _this.get( 'notify' );

                if( !Ember.isEmpty( data.files[ 0 ] ) ){
                    if( _this.get( 'acceptedFiles' ).contains( data.files[ 0 ][ 'type' ] ) ){
                        if( data.files[ 0 ][ 'size' ] <= _this.get( 'maxFileSize' ) ){
                            _this.send( 'addFile', data );
                        }
                        // File size too large
                        else{
                            var filesizeMG = maxFileSize / 1000000;
                            notify.alert( 'File size too large ( Max file size ' + filesizeMG + 'MB )', {
                                closeAfter: 5000
                            } );
                            data.abort();
                        }
                    }
                    else{
                        // File type invalid
                        notify.alert( 'File ' + data.files[0]['name'] + ' invalid file type', {
                            closeAfter: 5000
                        } );
                        data.abort();
                    }
                }
                else{
                    notify.alert( { raw: config.messages.update_error, closeAfter: 5000 } );
                }
            },
            fail: function( e, data ){
                var notify = _this.get( 'controller.notify' );
                if( data.hasOwnProperty( 'jqXHR' ) && data.jqXHR.hasOwnProperty( 'status' ) ){
                    notify.alert( { raw: config.messages.update_error, closeAfter: 5000 } );
                }
            }
        } ).prop( 'disabled', false );
    },

    actions: {
        addFile: function( fileData ){
            fileData.style = 'width: 0%;';
            fileData.progress = 0;
            fileData.documentType = null;
            fileData.name = fileData.files[ 0 ].name;
            fileData.type = fileData.files[ 0 ].type;
            this.get( 'fileQueue' ).pushObject( fileData );
        },
        upload: function(){
            var documentData = this.get( 'documentData' );
            var _this = this;
            var fileQueue = this.get( 'fileQueue' );

            fileQueue.forEach( function( file ){
                // Validate
                if( !Ember.isEmpty( file.documentType ) ){
                    file.formData = documentData;
                    file.formData[ 'category' ] = file.documentType;
                    file.submit().success( function(){
                        fileQueue.removeObject( file );
                        _this.sendAction( 'action' );
                    } );
                }
            } );
        },
        remove: function( document ){
            this.get( 'fileQueue' ).removeObject( document );
        }
    }
} );