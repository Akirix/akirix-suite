import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( status ){
    var icon = '';
    switch( status ){
        case 0:
            icon = '<span class="hint--left hint--rounded" data-hint="Draft"><i class="text-blue fa fa-file-o fa-fw"></i></span>';
            break;
        case 1:
            icon = '<span class="hint--left hint--rounded" data-hint="Invitation sent, awaiting response"><i class="text-blue fa fa-spinner fa-spin fa-fw"></i></span>';
            break;
        case 2:
            icon = '<span class="hint--left hint--rounded" data-hint="Ongoing"><i class="text-green-dark fa fa-truck circle-o fa-fw"></i></span>';
            break;
        case 3:
            icon = '<span class="hint--left hint--rounded" data-hint="Completed"><i class="text-green-dark fa fa-check-circle-o fa-fw"></i></span>';
            break;
        case 4:
            icon = '<span class="hint--left hint--rounded" data-hint="Cancelled"><i class="text-rose fa fa-times-circle-o fa-fw"></i></span>';
            break;
        default:
            icon = '';
    }
    return new Ember.Handlebars.SafeString( icon );
} );