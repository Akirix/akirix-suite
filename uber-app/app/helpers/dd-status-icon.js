import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( status ){
    var icon = '';
    switch( status ){
        case 0:
            icon = '';
            break;
        case 1:
            icon = '<span class="text-blue">Requested</span>';
            break;
        case 2:
            icon = '<span class="text-green">Completed</span>';
            break;
        default:
            icon = '';
    }
    return new Ember.Handlebars.SafeString( icon );
} );