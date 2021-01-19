import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( type ){
    var icon = '';
    switch( type ){
        case 0:
            icon = '<span class="hint--left hint--rounded" data-hint="Withdrawal"><i class="text-rose fa fa-sign-out fa-fw"></i></span>';
            break;
        case 1:
            icon = '<span class="hint--left hint--rounded" data-hint="Deposit"><i class="text-green-dark fa fa-sign-in fa-fw"></i></span>';
            break;
        case 2:
            icon = '<span class="hint--left hint--rounded" data-hint="Internal Transfer"><i class="text-blue fa fa-retweet fa-fw"></i></span>';
            break;
        default:
            icon = '';
    }
    return new Ember.Handlebars.SafeString( icon );
} );