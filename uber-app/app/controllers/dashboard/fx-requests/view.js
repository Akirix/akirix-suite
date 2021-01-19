import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';

var locale = new Globalize( navigator.language );

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],
    validations: {
        'model.reference': {
            presence: {
                'if': function( obj, validator ){
                    var status = obj.get( 'model.status' );
                    if( status === 1 ){
                        return true;
                    }
                }
            }
        },
        'model.confirmation': {
            presence: {
                'if': function( obj, validator ){
                    var status = obj.get( 'model.status' );
                    if( status === 1 ){
                        return true;
                    }
                }
            }
        },
        'model.to_account_id': {
            presence: {
                'if': function( obj, validator ){
                    var status = obj.get( 'model.status' );
                    if( status === 1 && Ember.isEmpty( obj.get( 'model.account_name' ) ) ){
                        return true;
                    }
                }
            }
        },
        'model.account_name': {
            presence: {
                'if': function( obj, validator ){
                    var to_account_id = obj.get( 'model.to_account_id' );
                    if( to_account_id === null ){
                        return true;
                    }
                }
            }
        },
        'debitedAmount': {
            presence: {
                'if': function( obj, validator ){
                    var status = obj.get( 'model.status' );
                    return status === 1

                }
            },
            numericality: {
                greaterThan: 0
            }
        },
        'creditedAmount': {
            presence: {
                'if': function( obj, validator ){
                    var status = obj.get( 'model.status' );
                    if( status === 1 ){
                        return true;
                    }
                }
            },
            numericality: {
                greaterThan: 0
            }
        }
    },

    actions: {

        cancelFXRequest: function( fx_request_id ){
            var self = this;
            Ember.$.ajax( {
                url: config.APP.uber_api_host + '/fxRequests/' + fx_request_id + '/cancel',
                type: 'POST',
                contentType: "application/json"
            } ).then(
                function( xhr, status, error ){
                    var route = self.container.lookup( 'route:dashboard.fx-requests' );
                    self.notify.success( 'FX request Has Been Cancelled.', { closeAfter: 5000 } );
                    route.refresh();
                    self.transitionToRoute( 'dashboard.fx-requests' );
                },
                function( xhr ){
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                } );
        },


        startRequest: function( fx_request_id ){
            var self = this;
            Ember.$.ajax( {
                url: config.APP.uber_api_host + '/fxRequests/' + fx_request_id + '/start',
                type: 'POST'
            } ).then(
                function( response ){
                    var route = self.container.lookup( 'route:dashboard.fx-requests' );
                    self.notify.success( 'Fx Request Started.', { closeAfter: 5000 } );
                    route.refresh();
                    self.transitionToRoute( 'dashboard.fx-requests' );
                },
                function( xhr ){
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                }
            );

        },

        completeRequest: function( fx_request_id ){
            var self = this;
            this.validate().then(
                function(){
                    self.set( 'isLocked', true );

                    if( Ember.isEmpty( self.get( 'model.to_account_id' ) ) ){
                        var newAccount = self.store.createRecord( 'Account', {
                            name: self.get( 'model.account_name' ),
                            company_id: self.get( 'model.company_id' ),
                            currency_id: self.get( 'model.counter_currency_id' )
                        } );
                        newAccount.save().then(
                            function(){
                                var payload = {
                                    reference: self.get( 'model.reference' ),
                                    confirmation: self.get( 'model.confirmation' ),
                                    to_account_id: newAccount.id,
                                    debited_amount: Number( self.get( 'debitedAmount' ) ),
                                    credited_amount: Number( self.get( 'creditedAmount' ) )
                                };
                                Ember.$.ajax( {
                                    url: config.APP.uber_api_host + '/fxRequests/' + fx_request_id + '/complete',
                                    type: 'POST',
                                    contentType: 'application/json; charset=utf-8',
                                    dataType: 'json',
                                    data: JSON.stringify( { data: payload } )
                                } ).then(
                                    function( response ){
                                        var route = self.container.lookup( 'route:dashboard.fx-requests' );
                                        self.notify.success( 'Fx Request completed.', { closeAfter: 5000 } );
                                        route.refresh();
                                        self.transitionToRoute( 'dashboard.fx-requests' );
                                    },
                                    function( xhr ){
                                        self.get( 'akxUtil' ).handleError( xhr, {
                                            scope: self
                                        } );
                                        self.set( 'isLocked', false );
                                    } );
                            },
                            function( xhr ){
                                self.get( 'akxUtil' ).handleError( xhr, {
                                    scope: self
                                } );
                                self.set( 'isLocked', false );
                            }
                        );
                    }
                    else{
                        var payload = {
                            reference: self.get( 'model.reference' ),
                            confirmation: self.get( 'model.confirmation' ),
                            to_account_id: self.get( 'model.to_account_id' ),
                            debited_amount: Number( self.get( 'debitedAmount' ) ),
                            credited_amount: Number( self.get( 'creditedAmount' ) )
                        };
                        Ember.$.ajax( {
                            url: config.APP.uber_api_host + '/fxRequests/' + fx_request_id + '/complete',
                            type: 'POST',
                            contentType: 'application/json; charset=utf-8',
                            dataType: 'json',
                            data: JSON.stringify( { data: payload } )
                        } ).then(
                            function( response ){
                                var route = self.container.lookup( 'route:dashboard.fx-requests' );
                                self.notify.success( 'Fx Request completed.', { closeAfter: 5000 } );
                                route.refresh();
                                self.transitionToRoute( 'dashboard.fx-requests' );
                            },
                            function( xhr ){
                                self.get( 'akxUtil' ).handleError( xhr, {
                                    scope: self
                                } );
                                self.set( 'isLocked', false );
                            } );
                    }
                },
                function(){

                }
            );
        }
    }
} );