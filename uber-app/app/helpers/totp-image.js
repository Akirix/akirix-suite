import Ember from 'ember';
import config from 'uber-app/config/environment';
export default Ember.Handlebars.makeBoundHelper( function( key, name, token ){
    var uberUrl = config.APP.uber_api_host + '/uberAuthenticators/qr?key=' + key + '&name=' + encodeURIComponent( name ) + '&token=' + token;
    var imgString = '<img src="' + uberUrl + '" />';
    return new Ember.Handlebars.SafeString( imgString );
} );