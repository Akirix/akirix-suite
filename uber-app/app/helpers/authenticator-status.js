import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( status ){
    var icon = '';
    switch( status ){
        case 0:
            icon = '<span  class="hint--left hint--rounded" data-hint="New"><i class="text-blue fa fa-lightbulb-o fa-fw"></i></span>';
            break;
        case 1:
            icon = '<span  class="hint--left hint--rounded" data-hint="Active"><i class="text-green-dark fa fa-check-circle-o fa-fw"></i></span>';
            break;
        default:
            icon = '';
    }
    return new Ember.Handlebars.SafeString( icon );
} );