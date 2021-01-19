import Ember from 'ember';
import DS from 'ember-data';
var locale = new Globalize( navigator.language );
import config from 'uber-app/config/environment';

var monthNames = [ '', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];

export default DS.Model.extend( {
    company_id: DS.attr(),
    account_id: DS.attr(),
    year: DS.attr(),
    month: DS.attr(),

    name: function(){
        return monthNames[ this.get( 'month' ) ] + ', ' + this.get( 'year' );
    }.property( 'month', 'year' ),

    url_download: function(){
        return config.APP.uber_api_host + '/statements/' + this.get( 'id' ) + '/download';
    }.property( 'id' )
} );
