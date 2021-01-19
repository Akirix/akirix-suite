import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( type ){
    var icon = '';
    switch( type ){
        case 0:
            icon = '<span class="hint--left hint--rounded" data-hint="Tree Type Project"><i class="fa fa-sitemap fa-fw"></i></span>';
            break;
        case 1:
            icon = '<span class="hint--left hint--rounded" data-hint="Linear Type Project"><i class="fa fa-link fa-fw"></i></span>';
            break;
        default:
            icon = '';
    }
    return new Ember.Handlebars.SafeString( icon );
} );