var _ = require( 'lodash' );

module.exports = {
    listen: function( server ){
        this.io = require( 'socket.io' )( server );

        this.io.sockets.on( 'connection', function( socket ){
            if( !_.isEmpty( socket.handshake.query.token ) ){
                socket.join( socket.handshake.query.token );
            }
        } );

        this.io.sockets.on( 'disconnect', function( socket ){
            if( !_.isEmpty( socket.handshake.query.token ) ){
                socket.leave( socket.handshake.query.token );
            }
        } );
    }
};