import Ember from 'ember';
import config from 'uber-app/config/environment';

export default {
    name: "socket",
    initialize: function( container, application ){
        var socket = io( config.APP.uber_api_host );

        container.register( 'socket:main', socket, { instantiate: false, singleton: true } );

        //expose it within controllers / routes / adapters as `this.get('socket')`
        application.inject( 'controller', 'socket', 'socket:main' );
        application.inject( 'route', 'socket', 'socket:main' );
        application.inject( 'adapter', 'socket', 'socket:main' );
    }
};
