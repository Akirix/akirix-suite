import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper( function( country_code ){
    var flagClass = 'flag-' + country_code;
    var imgString = '<div src="/assets/img/blank.png" class="flag ' + flagClass.toLowerCase() + '" alt="' + country_code + '" ></div>';
    return new Ember.Handlebars.SafeString( imgString );
} );