import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( status ){
    var icon = '';
    switch( status ){
        case 0:
            icon = '<span class="hint--right hint--rounded" data-hint="Inactive Account"><i class="text-gray-light fa fa-check-circle-o fa-lg"></i></span>';
            break;
        case 1:
            icon = '<span class="hint--right hint--rounded" data-hint="Active Account"><i class="text-green-dark fa fa-check-circle-o fa-lg"></i></span>';
            break;

        default:
            icon = '';
    }
    return new Ember.Handlebars.SafeString( icon );
} );