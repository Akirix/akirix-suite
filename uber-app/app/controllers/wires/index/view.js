import Ember from 'ember';
import config from 'uber-app/config/environment';

export default Ember.Controller.extend( {
    needs: [ 'application' ],
    sortProperties: [ 'created_at' ],
    sortAscending: false,

    actions: {
        undoWire: function(){
            var self = this;
            Ember.$.ajax( {
                url: config.APP.uber_api_host + '/wires/' + self.get( 'model.id' ) + '/undo',
                type: 'POST',
                contentType: 'application/json; charset=utf-8'
            } ).then(
                function(){
                    self.notify.success( 'Undid changes to wire', { closeAfter: 5000 } );
                    var route = self.container.lookup( 'route:wires.index' );
                    route.refresh();
                    self.transitionToRoute( 'wires.index' );
                },
                function( xhr ){
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                }
            )
        },

        getPdf: function(){
            window.open( this.get( 'model.url_pdf' ) + '?token=' + this.get( 'session.access_token' ), '_self' );
        }
    }
} );