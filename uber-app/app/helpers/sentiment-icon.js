import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( number ){
    var icon = '';
    switch( number ){
        case 0:
            icon = '<span class="hint--left hint--rounded" data-hint="Negative"><i class="text-rose fa fa-thumbs-down fa-fw"></i></span>';
            break;
        case 2:
            icon = '<span class="hint--left hint--rounded" data-hint="Positive"><i class="text-green-dark fa fa-thumbs-up fa-fw"></i></span>';
            break;
        default:
            icon = '';
    }
    return new Ember.Handlebars.SafeString( icon );
} );