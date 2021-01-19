import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( method, speedwire ){
    var icon = '';
    switch( method ){
        case 0:
            if( speedwire ){
                icon = '<i class="fa fa-rocket fa-fw"></i><i class="fa fa-flash fa-fw"></i> WIRE';
            }
            else{
                icon = '<i class="fa fa-rocket fa-fw"></i> WIRE';
            }
            break;
        case 1:
            icon = '<i class="fa fa-bicycle fa-fw"></i> ACH';
            break;
        default:
            icon = '';
    }

    icon = '<span class="small text-gray">' + icon + '</span>';

    return new Ember.Handlebars.SafeString( icon );
} );