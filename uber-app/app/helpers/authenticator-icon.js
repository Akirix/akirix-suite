import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( type ){
    var icon = '';
    switch( type ){
        case 0:
            icon = '<span class="hint--left hint--rounded" data-hint="Phone"><i class="fa fa-mobile fa-fw"></i></span>';
            break;
        case 1:
            icon = '<span class="hint--left hint--rounded" data-hint="Tablet"><i class="fa fa-tablet fa-fw"></i></span>';
            break;
        case 3:
            icon = '<span class="hint--left hint--rounded" data-hint="Akirix Key"><i class="fa fa-key fa-fw"></i></span>';
            break;
        case 4:
            icon = '<span class="hint--left hint--rounded" data-hint="Voice"><i class="fa fa-volume-control-phone fa-fw"></i></span>';
            break;
        default:
            icon = '<span class="hint--left hint--rounded" data-hint="Other"><i class="fa fa-shield fa-fw"></i></span>';
    }
    return new Ember.Handlebars.SafeString( icon );
} );