import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( status ){
    var icon = '';
    switch( status ){
        case 0:
            icon = '<i class="text-rose fa fa-times-circle-o fa-fw"></i>';
            break;
        case 1:
            icon = '<i class="text-green-dark fa fa-check-circle-o fa-fw"></i>';
            break;
        case 2:
            icon = '<i class="text-orange fa fa-snowflake-o fa-fw"></i>';
            break;
        default:
            icon = '';
    }
    return new Ember.Handlebars.SafeString( icon );
} );