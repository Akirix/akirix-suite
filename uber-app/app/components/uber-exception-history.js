import Ember from 'ember';
import config from 'uber-app/config/environment';

export default Ember.Component.extend( {

    store: Ember.inject.service(),
    notify: Ember.inject.service(),


    init: function(){
        this._super();
    },

    callOnInit: function(){
        this.getUberExceptions();
    }.on( 'init' ),

    observeModelChange: function(){
        if( this.get( 'uberExceptions' ) ){
            this.getUberExceptions();
        }
    }.observes( 'model_id' ),

    getUberExceptions: function(){
        var self = this;
        this.store.find( 'uber-exception', { model: 'wire', model_id: this.get( 'model_id' ), status: [ 0, 1, 2 ] } ).then( function( uberExceptions ){
            if( uberExceptions && !self.isDestroyed ){
                self.set( 'uberExceptions', uberExceptions );
            }

        } );
    }
} );