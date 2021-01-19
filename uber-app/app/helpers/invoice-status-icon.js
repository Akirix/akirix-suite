import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( status ){
    var icon = '';
    switch( status ){
        case 0:
            icon = '<span class="hint--left hint--rounded text-rose bold" style="font-size: 10px; padding: 0.2em; border: 1px solid #e52817;" data-hint="Draft">DRAFT</span>';
            break;
        case 1:
            icon = '<span class="hint--left hint--rounded" data-hint="Sent, awaiting response"><i class="text-blue fa fa-paper-plane-o fa-fw"></i></span>';
            break;
        case 2:
            icon = '<span class="hint--left hint--rounded" data-hint="Partially paid"><i class="text-green-dark fa fa-pie-chart circle-o fa-fw"></i></span>';
            break;
        case 3:
            icon = '<span class="hint--left hint--rounded" data-hint="Paid in full"><i class="text-green-dark fa fa-check-circle-o fa-fw"></i></span>';
            break;
        case 4:
            icon = '<span class="hint--left hint--rounded" data-hint="Cancelled"><i class="text-rose fa fa-times-circle-o fa-fw"></i></span>';
            break;
        default:
            icon = '';
    }
    return new Ember.Handlebars.SafeString( icon );
} );