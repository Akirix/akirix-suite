import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( type ){
    var icon = '';
    switch( type ){
        case 0:
            icon = '<span class="hint--left hint--rounded" data-hint="Breached"><i class="text-rose fa fa-exclamation-triangle fa-fw"></i></span>';
            break;
        case 1:
            icon = '<span class="hint--left hint--rounded" data-hint="Pasted"><i class="text-blue fa fa-paste fa-fw"></i></span>';
            break;

        default:
            icon = '';
    }
    return new Ember.Handlebars.SafeString( icon );
} );
