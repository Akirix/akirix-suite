import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( beneficiaryType ){
    var icon = '';
    switch( beneficiaryType ){
        case 0:
            icon = '<i class="fa fa-user fa-fw"></i>';
            break;
        case 1:
            icon = '<i class="fa fa-briefcase fa-fw"></i>';
            break;
        default:
            icon = '';
    }
    return new Ember.Handlebars.SafeString( icon );
} );