import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    code: null,
    itemCounts: null,
    showModal: false,
    globalPaneArray: Ember.A(),
    validations: {
        code: {
            presence: true
        }
    },

    dashboardCount: function(){
        return this.get( 'itemCounts.wires.wireOut.new' ) + this.get( 'itemCounts.wires.wireIn.new' ) + this.get( 'itemCounts.wireBatches.new' ) + this.get( 'itemCounts.commissionPayments.new' ) + this.get( 'itemCounts.fxRequests.open' );
    }.property( 'itemCounts' ),

    myDashbordCount: function(){
        return this.get( 'itemCounts.uberTasks.dueUser' ) + this.get( 'itemCounts.tickets.ticketsUser' );
    }.property( 'itemCounts' ),


    hideExtras: function(){
        if( this.get( 'currentRouteName' ) !== 'invoices.view-single' ){
            return true;
        }
        else{
            return false;
        }
    }.property( 'currentRouteName' ),

    updateItemCounts: function(){
        if( this.get( 'session.isAuthenticated' ) ){
            var self = this;
            Ember.$.ajax( {
                url: config.APP.uber_api_host + '/utilities/itemCounts',
                type: 'GET',
                dataType: "json"
            } ).then(
                function( response ){
                    self.set( 'itemCounts', response.itemCounts );
                },
                function( xhr ){
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                }
            );
        }
    },

    isTwoFactorAuthenticated: function(){
        var self = this;
        return new Ember.RSVP.Promise( function( resolve, reject ){
            Ember.$.ajax( {
                url: config.APP.uber_api_host + '/uberTokens/two_factor',
                type: 'GET'
            } ).then( function( response ){
                var isAuth = JSON.parse( response.isTwoFactorAuthenticated );
                if( !isAuth ){
                    resolve( false );
                }
                else{
                    resolve( true );
                }
            } );
        } );
    },

    joinSocketRoom: function(){
        var self = this;
        if( !Ember.isEmpty( this.get( 'session.access_token' ) ) ){
            this.get( 'socket' ).disconnect();
            this.get( 'socket' ).io.opts.query = "token=" + this.get( 'session.access_token' );
            this.get( 'socket' ).connect();

            this.get( 'socket' ).on( 'command', function( data ){
                self.store.fetch( data.model, data.model_id );
            } );

            this.get( 'socket' ).on( 'event', function( event ){
                switch( event.name ){
                    case 'two_factor_authenticated':
                        self.send( 'closePane' );
                        break;
                }
            } );
        }
    }.observes( 'session.access_token' ),

    actions: {

        closeOverPane: function(){
            Ember.$( '#overpane' ).removeClass( 'fadeInUpBig' ).addClass( 'fadeOutDownBig' );
        },

        cancelTwoFactorPane: function(){
            // Remove panel
            Ember.$( '#overpane' ).removeClass( 'fadeInUpBig' ).addClass( 'fadeOutDownBig' );
            Ember.$( '.modal-backdrop.in' ).remove();
            // Clear data
            this.set( 'code', null );
            this.set( 'errors.code', null );

            this.transitionToRoute( 'dashboard' );
        },

        twoFactorAuthenticate: function(){
            var self = this;
            var payload = {
                code: this.get( 'code' )
            };

            this.validate().then( function(){
                return new Ember.RSVP.Promise( function( resolve, reject ){
                    Ember.$.ajax( {
                        url: config.APP.uber_api_host + '/uberAuthenticators/auth',
                        type: 'POST',
                        contentType: "application/json; charset=utf-8",
                        dataType: 'json',
                        data: JSON.stringify( { data: payload } )
                    } ).then(
                        function( response ){
                            Ember.$( '#overpane' ).removeClass( 'fadeInUpBig' ).addClass( 'fadeOutDownBig' );
                            resolve( response );
                        },
                        function( xhr, status, error ){

                            if( Array.isArray( xhr.responseJSON.errors ) &&
                                xhr.responseJSON.errors.length === 1 &&
                                Array.isArray( xhr.responseJSON.errors[ 0 ].code ) &&
                                xhr.responseJSON.errors[ 0 ].code.length === 1 &&
                                typeof xhr.responseJSON.errors[ 0 ].code[ 0 ] === 'string'
                            ){
                                self.notify.error( xhr.responseJSON.errors[ 0 ].code[ 0 ], { closeAfter: 5000 } );
                            }
                            else{
                                self.get( 'akxUtil' ).handleError( xhr, {
                                    scope: self
                                } );
                            }

                            reject( xhr );
                        }
                    );
                } );
            }, function(){
            } );
        },

        twoFactorSms: function(){
            var self = this;
            return new Ember.RSVP.Promise( function( resolve, reject ){
                Ember.$.ajax( {
                    url: config.APP.uber_api_host + '/uberAuthenticators/sms',
                    type: 'POST',
                    contentType: 'application/json; charset=utf-8',
                    dataType: 'json'
                } ).then(
                    function( response ){
                        self.notify.success( response.message, { closeAfter: 5000 } );
                        resolve( response );
                    },
                    function( xhr, status, error ){
                        self.notify.error( 'There was an error sending the text message', { closeAfter: 5000 } );
                        reject( xhr );
                    }
                );
            } );
        },

        viewSingleInvoice: function( invoice_id ){
            window.open( '/#/invoices/' + invoice_id + '/single', invoice_id, 'directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,width=1024,height=800' );
        },

        invalidateSession: function(){
            var self = this;
            var token = self.get( 'session.access_token' );

            Ember.$.ajax( {
                url: config.APP.uber_api_host + '/uberTokens/revoke',
                type: 'POST',
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                data: JSON.stringify( { token: token } )
            } ).then(
                function(){
                    self.get( 'session' ).invalidate();
                },
                function( xhr ){
                    self.get( 'session' ).invalidate();
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                }
            );
        }

    }
} );

