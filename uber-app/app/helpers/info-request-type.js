import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( type ){
    var res = '';
    switch( type ){
        case 0:
            res = 'Text';
            break;
        case 1:
            res = 'Document';
            break;
        case 2:
            res = 'Terms & Conditions';
            break;
        default:
            res = '';
    }
    return new Ember.Handlebars.SafeString( res );
} );