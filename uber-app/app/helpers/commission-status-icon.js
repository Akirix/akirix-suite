import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( number ){
    var icon = '';
    switch( number ){
        case 0:
            icon = '<span class="hint--left hint--rounded" data-hint="Inactive"><i class="text-rose fa fa-times-circle fa-fw"></i></span>';
            break;
        case 1:
            icon = '<span class="hint--left hint--rounded" data-hint="Completed"><i class="text-green-dark fa fa-check-circle fa-fw"></i></span>';
            break;
        default:
            icon = '';
    }
    return new Ember.Handlebars.SafeString( icon );
} );