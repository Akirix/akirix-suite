import Ember from 'ember';
import EmberValidations from 'ember-validations';
import pagedArray from 'ember-cli-pagination/computed/paged-array';
import config from 'uber-app/config/environment';

export default Ember.ArrayController.extend( {
    paneSecondary: null,
    needs: [ 'application' ],

    hasNewWires: function(){
        return (this.get( 'wires.length' ) + this.get( 'startedWires.length' )) > 0;
    }.property( 'wires.length', 'startedWires.length' ),

    actions: {
        newBatch: function(){
            var self = this;
            var newBatch = self.store.createRecord( 'wire-batch', { type: 0 } );

            newBatch.save().then(
                function(){
                    var route = self.container.lookup( 'route:dashboard.pending-out' );
                    self.notify.success( 'New batch created.', { closeAfter: 5000 } );
                    route.refresh();
                },

                function( xhr ){
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                } );
        },

        addToBatch: function( wire, batch_id ){
            if( wire ){
                var batchType;
                if( wire.get( 'speedwire' ) === 1 ){
                    batchType = 2;
                }
                else if( wire.get( 'method' ) === 1 ){
                    batchType = 3;
                }
                else{
                    batchType = 0;
                }

                if( batch_id ){
                    Ember.$.ajax( {
                        url: config.APP.uber_api_host + '/wires/' + wire.get( 'id' ) + '/addToBatch',
                        type: 'post',
                        contentType: "application/json; charset=utf-8",
                        dataType: 'json',
                        data: JSON.stringify( { wire_batch_id: batch_id } )
                    } ).then(
                        function(){
                            wire.reload();
                            var route = this.container.lookup( 'route:dashboard.pending-out' );
                            this.notify.success( 'Wire added to batch successfully.', { closeAfter: 5000 } );
                            route.refresh();
                        }.bind( this ), function( xhr ){
                            this.get( 'akxUtil' ).handleError( xhr, {
                                scope: this
                            } );
                        }.bind( this ) );
                }
                else if( this.get( 'newBatches' ).isAny( 'type', batchType ) ){
                    var batchId = this.get( 'newBatches' ).findBy( 'type', batchType ).get( 'id' );
                    Ember.$.ajax( {
                        url: config.APP.uber_api_host + '/wires/' + wire.get( 'id' ) + '/addToBatch',
                        type: 'post',
                        contentType: "application/json; charset=utf-8",
                        dataType: 'json',
                        data: JSON.stringify( { wire_batch_id: batchId } )
                    } ).then(
                        function(){
                            wire.reload();
                            var route = this.container.lookup( 'route:dashboard.pending-out' );
                            this.notify.success( 'Wire added to batch successfully.', { closeAfter: 5000 } );
                            route.refresh();
                        }.bind( this ), function( xhr ){
                            this.get( 'akxUtil' ).handleError( xhr, {
                                scope: this
                            } );
                        }.bind( this ) );
                }
                else{
                    this.store.createRecord( 'wire-batch', { type: batchType } ).save().then(
                        function( wireBatch ){
                            Ember.$.ajax( {
                                url: config.APP.uber_api_host + '/wires/' + wire.get( 'id' ) + '/addToBatch',
                                type: 'post',
                                contentType: "application/json; charset=utf-8",
                                dataType: 'json',
                                data: JSON.stringify( { wire_batch_id: wireBatch.get( 'id' ) } )

                            } ).then(
                                function(){
                                    var route = this.container.lookup( 'route:dashboard.pending-out' );
                                    this.notify.success( 'Wire added to batch successfully.', { closeAfter: 5000 } );
                                    route.refresh();
                                }.bind( this ), function( xhr ){
                                    this.get( 'akxUtil' ).handleError( xhr, {
                                        scope: this
                                    } );
                                }.bind( this ) );
                        }.bind( this ),
                        function( xhr ){
                            this.get( 'akxUtil' ).handleError( xhr, {
                                scope: this
                            } );
                        }.bind( this ) );
                }
            }
            else{
                this.notify.error( 'Could not add wire to batch.', { closeAfter: 5000 } );
            }
        },

        removeFromBatch: function( wire ){
            var self = this;
            Ember.$.ajax( {
                url: config.APP.uber_api_host + '/wires/' + wire.id + '/removeFromBatch',
                type: 'post'
            } ).then( function( response ){
                if( !response.wire ){
                    self.notify.error( 'Could not remove wire from batch.', { closeAfter: 5000 } );
                }
                else{
                    var route = self.container.lookup( 'route:dashboard.pending-out' );
                    self.notify.success( 'Wire was removed from batch successfully.', { closeAfter: 5000 } );
                    route.refresh();
                }
            } );
        },

        toggleContent: function( batch ){
            batch.toggleProperty( 'isVisible' );
        },

        goToWire: function( wire_id ){
            this.transitionToRoute( 'dashboard.pending-out.view', wire_id );
        },

        goToBatch: function( batch_id ){
            this.transitionToRoute( 'dashboard.pending-out.view-batch', batch_id );
        },

        deleteBatch: function( batch ){
            var self = this;
            batch.destroyRecord().then(
                function(){
                    var route = self.container.lookup( 'route:dashboard.pending-out' );
                    route.refresh();
                    self.notify.success( 'Batch has been removed.', { closeAfter: 5000 } );
                },
                function( xhr ){
                    batch.rollback();
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } )
                } );
        }
    }
} );

