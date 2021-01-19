import Ember from 'ember';
import config from 'uber-app/config/environment';

export default Ember.Controller.extend( {
    needs: [ 'application' ],
    sortProperties: [ 'created_at' ],
    sortAscending: false,

    actions: {
        cancelWire: function( wire_id ){
            var self = this;
            Ember.run( function(){
                Ember.$.ajax( {
                    url: config.APP.api_host + '/wires/' + wire_id + '/cancel',
                    type: 'POST',
                    contentType: "application/json; charset=utf-8"
                } ).then(
                    function( response ){
                        self.store.find( 'wire', wire_id ).then( function( wire ){
                            wire.reload();
                        } );
                        self.notify.success( 'Transfer request has been cancelled.', { closeAfter: 5000 } );
                        self.send( 'goBack' );
                    },
                    function( xhr ){
                        self.get( 'akxUtil' ).handleError( xhr, {
                            scope: self
                        } );
                    } );
            } );
        },

        getPdf: function(){
            window.open( this.get( 'model.url_pdf' ) + '?token=' + this.get( 'session.access_token' ), '_self' );
        },
    }

} );

