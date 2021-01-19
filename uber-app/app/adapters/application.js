import DS from 'ember-data';
import config from 'uber-app/config/environment';

export default DS.RESTAdapter.extend( {
    host: config.APP.uber_api_host,
    namespace: '',

    ajaxError: function( jqXHR ){
        var error = this._super( jqXHR );
        return error;
    }

} );

