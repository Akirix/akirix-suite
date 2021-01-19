import Ember from 'ember';
export default Ember.Handlebars.makeBoundHelper( function( value ){
    var fileTypes = {
        'image/gif': '<i class="fa fa-file-image-o"></i>',
        'image/jpeg': '<i class="fa fa-file-image-o"></i>',
        'image/pjpeg': '<i class="fa fa-file-image-o"></i>',
        'image/png': '<i class="fa fa-file-image-o"></i>',
        'application/pdf': '<i class="fa fa-file-pdf-o"></i>',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '<i class="fa fa-file-word-o"></i>',
        'application/vnd.ms-excel': '<i class="fa fa-file-excel-o"></i>'
    };

    if( fileTypes.hasOwnProperty( value ) ){
        return new Ember.Handlebars.SafeString( fileTypes[ value ] );
    }
    else{
        return new Ember.Handlebars.SafeString( '<i class="fa fa-file-o"></i>' );
    }
} );