import Ember from 'ember';
import config from 'uber-app/config/environment';

export default Ember.Component.extend( {

    store: Ember.inject.service(),
    notify: Ember.inject.service(),

    callOnInit: function() {
        this.getUberExceptions();
    }.on( 'init' ),

    observeModelChange: function() {
        if ( this.get( 'uberExceptions' ) ) {
            this.getUberExceptions();
        }
    }.observes( 'model_id' ),

    obsModelChange: function() {
        this.set( 'hasException', this.get( 'uberExceptions.length' ) !== 0 );
    }.observes( 'uberExceptions.length' ),

    showBulkAction: function(){
        if ( this.get( 'uberExceptions' ) ){
            return this.get( 'uberExceptions' ).filter( function( uberException ) {
                return uberException.get( 'isPending' );
            } ).length > 1
        }
    }.property( 'uberExceptions.length', 'uberExceptions.@each.status' ),

    getUberExceptions: function() {
        var self = this;
        this.store.find( 'uber-exception', { model: 'wire', model_id: this.get( 'model_id' ), status: [ 0, 1 ] } ).then( function( uberExceptions ) {
            self.set( 'uberExceptions', uberExceptions );
        } );
    },

    actions: {
        accept: function( exception ) {
            var self = this;

            exception.get( 'reason' ).trim();
            if ( !Ember.isEmpty( exception.get( 'reason' ) ) ) {
                Ember.$.ajax( {
                    url: config.APP.uber_api_host + '/uberExceptions/' + exception.get( 'id' ) + '/accept',
                    type: 'POST',
                    contentType: "application/json; charset=utf-8",
                    dataType: 'json',
                    data: JSON.stringify( { uber_exception: exception } )
                } ).then(
                    function( res ) {
                        Ember.$( '#' + exception.id ).removeClass( 'in' );
                        self.get( 'store' ).push( 'uber-exception', res.UberException );
                    },
                    function( xhr ) {
                        self.get( 'akxUtil' ).handleError( xhr, {
                            scope: self
                        } );
                    } );
            }
            else {
                this.get( 'notify' ).error( 'Reason must be provided.', { closeAfter: 5000 } );
            }
        },

        reject: function( exception ) {
            var self = this;

            exception.get( 'reason' ).trim();
            if ( !Ember.isEmpty( exception.get( 'reason' ) ) ) {
                Ember.$.ajax( {
                    url: config.APP.uber_api_host + '/uberExceptions/' + exception.get( 'id' ) + '/reject',
                    type: 'POST',
                    contentType: "application/json; charset=utf-8",
                    dataType: 'json',
                    data: JSON.stringify( { uber_exception: exception } )
                } ).then(
                    function() {
                        exception.unloadRecord();
                    },
                    function( xhr ) {
                        self.get( 'akxUtil' ).handleError( xhr, {
                            scope: self
                        } );
                    } );
            }
            else {
                this.get( 'notify' ).error( 'Reason must be provided.', { closeAfter: 5000 } );
            }
        },

        handleAll: function( option ) {
            var self = this;
            this.get( 'uberExceptions' ).filter( function( uberException ) {
                return uberException.get( 'isPending' );
            } ).forEach( function( uberException ) {
                uberException.set( 'reason', self.get( 'reason' ) );
                self.send( option, uberException );
            } );
        }
    }
} );