import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( type ){
    var icon = '';
    switch( type ){
        case 'image/png':
            icon = '<i class="fa fa-file-image-o fa-fw"></i>';
            break;
        case 'image/jpeg':
            icon = '<i class="fa fa-file-image-o fa-fw"></i>';
            break;
        case 'image/gif':
            icon = '<i class="fa fa-file-image-o fa-fw"></i>';
            break;
        case 'application/pdf':
            icon = '<i class="fa fa-file-pdf-o fa-fw"></i>';
            break;
        case 'text/csv':
            icon = '<i class="fa fa-file-excel-o fa-fw"></i>';
            break;
        case 'application/vnd.ms-excel':
            icon = '<i class="fa fa-file-excel-o fa-fw"></i>';
            break;
        case 'application/msexcel':
            icon = '<i class="fa fa-file-excel-o fa-fw"></i>';
            break;
        case 'application/excel':
            icon = '<i class="fa fa-file-excel-o fa-fw"></i>';
            break;
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            icon = '<i class="fa fa-file-excel-o fa-fw"></i>';
            break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            icon = '<i class="fa fa-file-word-o fa-fw"></i>';
            break;
        case 'application/msword':
            icon = '<i class="fa fa-file-word-o fa-fw"></i>';
            break;
        default:
            icon = '<i class="fa fa-file-o fa-fw"></i>';
    }
    return new Ember.Handlebars.SafeString( icon );
} );