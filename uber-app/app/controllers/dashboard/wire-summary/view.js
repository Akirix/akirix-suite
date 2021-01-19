import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';
var locale = new Globalize( navigator.language );

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],
    canBeCompleted: false,
    modelUpdated: function(){
        var self = this;
        if( this.get( 'model.wire_batch_id' ) ){
            this.store.find( 'wire-batch', this.get( 'model.wire_batch_id' ) ).then( function( wireBatch ){
                if( wireBatch.get( 'status' ) === 1 || wireBatch.get( 'status' ) === 2 ){
                    self.set( 'canBeCompleted', true );
                } else{
                    self.set( 'canBeCompleted', false );
                }

            } )
        } else{
            self.set( 'canBeCompleted', true )
        }
    }.observes( 'model' ),

    validations: {
        'model.confirmation': {
            presence: {
                'if': function( obj, validator ){
                    var status = obj.get( 'model.status' );
                    if( status === 1 ){
                        return true;
                    }
                    else{
                        return false;
                    }
                }
            }
        }
    },

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
                    var route = self.container.lookup( 'route:dashboard.wire-summary' );
                    route.refresh();
                    self.transitionToRoute( 'dashboard.wire-summary' );
                },
                function( xhr ){
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                }
            )
        },

        completeWire: function( wire_id ){
            var self = this;
            this.validate().then(
                function(){
                    self.set( 'isLocked', true );
                    var payload = {
                        confirmation: self.get( 'model.confirmation' )
                    };
                    Ember.$.ajax( {
                        url: config.APP.uber_api_host + '/wires/' + wire_id + '/complete',
                        type: 'post',
                        contentType: "application/json; charset=utf-8",
                        dataType: 'json',
                        data: JSON.stringify( { data: payload } )
                    } ).then(
                        function( response ){
                            var route = self.container.lookup( 'route:dashboard.wire-summary' );
                            self.notify.success( 'Wire completed.', { closeAfter: 5000 } );
                            route.refresh();
                            self.transitionToRoute( 'dashboard.wire-summary' );
                        },
                        function( xhr ){
                            self.get( 'akxUtil' ).handleError( xhr, {
                                scope: self
                            } );
                        } );
                },
                function(){
                }
            );
        },
    }
} );