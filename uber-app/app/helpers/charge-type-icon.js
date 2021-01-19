import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( type ){
    var icon = '';
    switch( type ){
        case 1:
            icon = '<span class="hint--left hint--rounded" data-hint="Recurring"><i class="text-gray-dark fa fa-refresh fa-fw"></i></span>';
            break;
        default:
            icon = '<span class="hint--left hint--rounded" data-hint="Recurring"><i class="text-gray-dark fa fa-fw"></i></span>';
    }
    return new Ember.Handlebars.SafeString( icon );
} );