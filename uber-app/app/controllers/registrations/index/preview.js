import Ember from 'ember';
import config from 'uber-app/config/environment';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application', 'registrations/index' ],
    paneSecondary: 'registrations/preview',

    showArchiveButton: function(){
        var status = this.get( 'model.status' );
        return status !== 2 && status !== 4;
    }.property( 'model.status' ),

    showInProgressButton: function(){
        var status = this.get( 'model.status' );
        return status !== 1 && status !== 2 && status !== 0;
    }.property( 'model.status' ),

    showHoldButton: function(){
        var status = this.get( 'model.status' );
        return status !== 1 && status !== 2 && status !== 3;
    }.property( 'model.status' ),

    actions: {
        markArchived: function(){
            var self = this;
            var akxUtil = this.get( 'akxUtil' );
            var registration = this.get( 'model' );

            self.set( 'isLocked', true );
            akxUtil._sendRequest( '/signupRegistrations/' + registration._id + '/status', 'put', { status: 4 } ).then( function( result ){
                self.set( 'isLocked', false );
                self.notify.info( 'Updated' );
                self.transitionToRoute( 'registrations.index' );
                self.get( 'controllers.registrations/index' ).refreshRegs();
            }, function(){
                self.set( 'isLocked', false );
                self.notify.alert( '' );
            } );
        },

        markInProgress: function(){
            var self = this;
            var akxUtil = this.get( 'akxUtil' );
            var registration = this.get( 'model' );

            self.set( 'isLocked', true );
            akxUtil._sendRequest( '/signupRegistrations/' + registration._id + '/status', 'put', { status: 0 } ).then( function( result ){
                self.set( 'isLocked', false );
                self.notify.info( 'Updated' );
                self.get( 'controllers.registrations/index' ).refreshRegs();
                self.transitionToRoute( 'registrations.index' );
            }, function(){
                self.set( 'isLocked', false );
                self.notify.alert( '' );
            } );
        },
        accept: function( exception ){
            var self = this;
            if( !Ember.isEmpty( exception.get( 'reason' ) ) ){
                Ember.$.ajax( {
                    url: config.APP.uber_api_host + '/exceptions/' + exception.id + '/accept',
                    type: 'POST',
                    contentType: "application/json; charset=utf-8",
                    dataType: 'json',
                    data: JSON.stringify( { exception: exception } )
                } ).then(
                    function( response ){
                        Ember.$( '#' + exception.id ).removeClass( 'in' );
                        self.store.push( 'exception', response.exception );
                    },
                    function( xhr ){
                        self.get( 'akxUtil' ).handleError( xhr, {
                            scope: self
                        } );
                    } );
            }
            else{
                self.notify.error( 'Reason must be provided.', { closeAfter: 5000 } );
            }
        },

        reject: function( exception ){
            var self = this;
            if( !Ember.isEmpty( exception.get( 'reason' ) ) ){
                Ember.$.ajax( {
                    url: config.APP.uber_api_host + '/exceptions/' + exception.id + '/reject',
                    type: 'POST',
                    contentType: "application/json; charset=utf-8",
                    dataType: 'json',
                    data: JSON.stringify( { exception: exception } )
                } ).then(
                    function(){
                        exception.deleteRecord();
                    },
                    function( xhr ){
                        self.get( 'akxUtil' ).handleError( xhr, {
                            scope: self
                        } );
                    } );
            }
            else{
                self.notify.error( 'Reason must be provided.', { closeAfter: 5000 } );
            }
        }

    }
} );

