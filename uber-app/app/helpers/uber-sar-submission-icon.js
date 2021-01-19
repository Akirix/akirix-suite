import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( type, status ){
    var icon = '';

    var symbol;
    var color;
    var data_hint = '';

    switch( type ){
        case 0:
            symbol = 'fa fa-university';
            data_hint += "FinCEN ";

            break;
        case 1:
            symbol = 'fa fa-building-o';
            data_hint += "goAML ";
            break;
    }

    switch( status ){
        case 0:
            color = 'text-gray';
            data_hint += 'Started';
            break;
        case 1:
            color = 'text-blue';
            data_hint += 'Sent';
            break;
        case 2:
            color = 'text-green-dark';
            data_hint += 'Confirmed';
            break;
    }

    icon = '<span class="hint--left hint--rounded" data-hint=" ' + data_hint + '"><i class=" ' + color + ' ' + symbol + ' fa-fw"></i></span>';

    return new Ember.Handlebars.SafeString( icon );
} );