import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';
var locale = new Globalize( navigator.language );

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],
    availableAccounts: [],
    account: null,

    wireMethods: [
        { label: 'Wire', val: 0 },
        { label: 'ACH', val: 1 }
    ],

    isUS: function(){
        return this.get( 'wire.bank_country' ) === 'US';
    }.property( 'wire.bank_country' ),

    validSWIFT: function(){
        if( !Ember.isEmpty( this.get( 'wire.code_swift' ) ) ){
            this.set( 'wire.code_swift', this.get( 'wire.code_swift' ).toUpperCase() );
        }
    }.observes( 'wire.code_swift' ),

    validIBAN: function(){
        if( !Ember.isEmpty( this.get( 'wire.account_iban' ) ) ){
            this.set( 'wire.account_iban', this.get( 'wire.account_iban' ).toUpperCase() );
        }
    }.observes( 'wire.account_iban' ),

    methodChanged: function(){
        if( this.get( 'wire.method' ) === 1 ){
            this.set( 'wire.bank_country', 'US' );
        }
    }.observes( 'wire.method' ),

    companyUpdated: function(){
        var self = this;
        if( !Ember.isEmpty( this.get( 'wire.company_id' ) ) ){
            this.store.find( 'account', { company_id: this.get( 'wire.company_id' ), currency_id: this.get( 'wire.currency_id' ) } )
                .then( function( accounts ){
                    self.set( 'availableAccounts', accounts.toArray() );
                } );
        }
        else{
            self.set( 'availableAccounts', [] );
        }
    }.observes( 'wire.company_id', 'wire.currency_id' ),


    accountSelected: function(){
        return false;
    }.property( 'accountSelected' ),

    validations: {
        'wire.company_id': {
            presence: true
        },
        'wire.account_id': {
            presence: true
        },
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


        'wire.account_holder': {
            presence: true
        }
    },

    actions: {

        completeWire: function( wire_id ){
            var self = this;
            this.validate().then(
                function(){
                    self.set( 'isLocked', true );

                    self.get( 'wire' ).save().then(
                        function(){
                            Ember.$.ajax( {
                                url: config.APP.uber_api_host + '/wires/' + wire_id + '/achRecall',
                                type: 'post',
                                contentType: "application/json; charset=utf-8",
                                dataType: 'json'
                            } ).then(
                                function( response ){
                                    var route = self.container.lookup( 'route:dashboard.ach-recall' );
                                    self.notify.success( 'Wire completed.', { closeAfter: 5000 } );
                                    route.refresh();
                                    self.transitionToRoute( 'dashboard.ach-recall' );
                                },
                                function( xhr ){
                                    self.get( 'akxUtil' ).handleError( xhr, {
                                        scope: self
                                    } );
                                } );
                        });
                },
                function(){

                }
            );
        }


    }

} );