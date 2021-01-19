import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';
var locale = new Globalize( navigator.language );

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],
    company: null,

    actions: {

        approvePayment: function(){
            var self = this;
            var data = {
                account_id: self.get( 'account.id' )
            };
            self.set( 'isLocked', true );
            Ember.run( function(){
                Ember.$.ajax( {
                    url: config.APP.uber_api_host + '/commissionPayments/' + self.get( 'cp.id' ) + '/approve',
                    dataType: 'JSON',
                    type: 'POST',
                    contentType: "application/json; charset=utf-8",
                    data: JSON.stringify( { data: data } )
                } ).then(
                    function( response ){
                        self.set( 'isLocked', false );
                        self.notify.success( 'Payment approved.', { closeAfter: 10000 } );
                        var route = self.container.lookup( 'route:dashboard.pending-commission-payments' );
                        route.refresh();
                        route.transitionTo( 'dashboard.pending-commission-payments' );
                    },
                    function( xhr ){
                        self.set( 'isLocked', false );
                        self.get( 'akxUtil' ).handleError( xhr, {
                            scope: self
                        } );
                    }
                );
            } );


        },

        denyPayment: function(){
            var self = this;
            self.set( 'isLocked', true );
            Ember.run( function(){
                Ember.$.ajax( {
                    url: config.APP.uber_api_host + '/commissionPayments/' + self.get( 'cp.id' ) + '/deny',
                    type: 'POST'
                } ).then(
                    function( response ){
                        self.set( 'isLocked', false );
                        self.notify.success( 'Payment denied.', { closeAfter: 5000 } );
                        var route = self.container.lookup( 'route:dashboard.pending-commission-payments' );
                        route.refresh();
                        route.transitionTo( 'dashboard.pending-commission-payments' );
                    },
                    function( xhr ){
                        self.set( 'isLocked', false );
                        self.get( 'akxUtil' ).handleError( xhr, {
                            scope: self
                        } );
                    }
                );
            } );
        }

    }
} );