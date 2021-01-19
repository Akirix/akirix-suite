import Ember from 'ember';

export default Ember.Helper.helper( function( [ currencyId ] ){
    var icon;
    switch( currencyId ){
        case 'USD':
            icon = '<i class="akx-icon akx-usd icon-usd-size"></i>';
            break;
        case 'EUR':
            icon = '<i class="akx-icon akx-euro icon-medium"></i>';
            break;
        case 'GBP':
            icon = '<i class="akx-icon akx-gbp icon-medium"></i>';
            break;
        case 'BTC':
            icon = '&#579;';
            break;
        default:
            icon = '';
    }
    return new Ember.String.htmlSafe( icon );
} );