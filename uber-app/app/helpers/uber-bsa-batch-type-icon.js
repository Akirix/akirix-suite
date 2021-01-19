import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( type ){
    var icon = '';
    switch( type ){
        case 0:
            icon = '<span class="hint--left hint--rounded" data-hint="Recurring">CTR Batch</span>';
            break;
        case 1:
            icon = '<span class="hint--left hint--rounded" data-hint="Recurring">SAR Batch</span>';
            break;

    }
    return new Ember.Handlebars.SafeString( icon );
} );