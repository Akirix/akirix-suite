import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';
var locale = new Globalize( navigator.language );

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],

    hasException: false,

    validations: {
        'wire.method': {
            presence: true
        },
        'wire.bank_name': {
            presence: true
        },
        'wire.bank_country': {
            presence: true
        },
        'wire.bank_city': {
            presence: {
                'if': function( obj, validator ){
                    var method = obj.get( 'wire.method' );
                    if( method === 1 ){
                        return true;
                    }
                }
            }
        },
        'wire.bank_state_province': {
            presence: {
                'if': function( obj, validator ){
                    var method = obj.get( 'wire.method' );
                    if( method === 1 ){
                        return true;
                    }
                }
            }
        },
        'wire.bank_postal_code': {
            presence: {
                'if': function( obj, validator ){
                    var method = obj.get( 'wire.method' );
                    if( method === 1 ){
                        return true;
                    }
                }
            }
        },
        'wire.code_swift': {
            presence: {
                'if': function( obj, validator ){
                    var method = obj.get( 'wire.method' );
                    if( method === 0 ){
                        if( Ember.isEmpty( obj.get( 'wire.code_aba' ) ) && Ember.isEmpty( obj.get( 'wire.code_swift' ) ) ){
                            return true;
                        }
                        else{
                            return false;
                        }
                    }
                    else if( method === 1 ){
                        return false;
                    }
                }
            }
        },
        'wire.code_aba': {
            presence: {
                'if': function( obj, validator ){
                    var method = obj.get( 'wire.method' );
                    if( method === 0 ){
                        if( Ember.isEmpty( obj.get( 'wire.code_aba' ) ) && Ember.isEmpty( obj.get( 'wire.code_swift' ) ) ){
                            return true;
                        }
                        else{
                            return false;
                        }
                    }
                    else if( method === 1 ){
                        return true;
                    }
                }
            }
        },

        'wire.account_id': {
            presence: true
        },
        'wire.account_holder': {
            presence: true
        },
        'wire.account_number': {
            presence: true
        },
        'wire.confirmation': {
            presence: {
                'if': function( obj, validator ){
                    var status = obj.get( 'wire.status' );
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

        holdWire: function(){
            var self = this;
            self.set( 'isLocked', true );
            self.set( 'wire.status', 4 );
            self.get( 'wire' ).save().then(
                function(){
                    self.set( 'isLocked', false );
                    self.notify.success( 'Wire updated.', { closeAfter: 5000 } );
                },
                function( xhr ){
                    self.set( 'isLocked', false );
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                }
            );

        },

        unholdWire: function(){
            var self = this;
            self.set( 'isLocked', true );
            self.set( 'wire.status', 0 );
            self.get( 'wire' ).save().then(
                function(){
                    self.set( 'isLocked', false );
                    self.notify.success( 'Wire unlocked.', { closeAfter: 5000 } );
                    self.container.lookup( 'route:dashboard.hold-in' ).refresh();
                    self.transitionToRoute( 'dashboard.hold-in' );
                },
                function( xhr ){
                    self.set( 'isLocked', false );
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                }
            );

        },

        cancelWire: function(){
            var self = this;
            Ember.$.ajax( {
                url: config.APP.uber_api_host + '/wires/' + self.get( 'wire.id' ) + '/cancel',
                type: 'POST',
                contentType: "application/json; charset=utf-8"
            } ).then(
                function(){
                    var route = self.container.lookup( 'route:dashboard.hold-in' );
                    self.notify.success( 'Transfer request has been cancelled.', { closeAfter: 5000 } );
                    route.refresh();
                    self.transitionToRoute( 'dashboard.hold-in' );
                },
                function( xhr ){
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                } );
        },

        rejectWire: function(){
            var self = this;
            Ember.$.ajax( {
                url: config.APP.uber_api_host + '/wires/' + self.get( 'wire.id' ) + '/reject',
                type: 'POST',
                contentType: "application/json; charset=utf-8"
            } ).then(
                function(){
                    var route = self.container.lookup( 'route:dashboard.hold-in' );
                    self.notify.success( 'Transfer request has been rejected.', { closeAfter: 5000 } );
                    route.refresh();
                    self.transitionToRoute( 'dashboard.hold-in' );
                },
                function( xhr ){
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                } );
        },
    }

} );