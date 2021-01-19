import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( number ){
    var icon = '';
    switch( number ){
        case 0:
            icon = '<span class="hint--left hint--rounded" data-hint="Low"><i class="text-gray fa fa-circle fa-fw"></i></span>';
            break;
        case 1:
            icon = '<span class="hint--left hint--rounded" data-hint="Medium"><i class="text-orange fa fa-circle fa-fw"></i></span>';
            break;
        case 2:
            icon = '<span class="hint--left hint--rounded" data-hint="High"><i class="text-rose fa fa-circle fa-fw"></i></span>';
            break;
        default:
            icon = '';
    }
    return new Ember.Handlebars.SafeString( icon );
} );