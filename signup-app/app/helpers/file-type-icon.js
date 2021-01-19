import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( fileType ){
    var icon = '';

    switch( fileType ){
        case 'image/gif':
        case 'image/jpeg':
        case 'image/pjpeg':
        case 'image/png':
        case 'application/pdf':
            icon = '<i class="xrk-icon xrk-document"></i>';
            break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            icon = '<i class="fa fa-file-excel-o"></i>';
            break;
        case 'application/vnd.ms-excel':
            icon = '<i class="fa fa-file-word-o"></i>';
            break;
        default:
            icon = '<i class="fa fa-file-o"></i>';
            break;
    }

    return new Ember.Handlebars.SafeString( icon );
} );

