import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( type ){
    var icon = '';
    switch( type ){
        case "A":
            icon = 'Inital Report';
            break;
        case "B":
            icon = 'Correct Amend Report';
            break;
            case "C":
        icon = 'Continued Report';
        break;
        default:
            icon = '';
    }
    return new Ember.Handlebars.SafeString( icon );
} );