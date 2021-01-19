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

    preferredAccountUpdated: function(){
        var self = this;
        var prefNum = this.get( 'wire.preferred_account_number' );
        self.set( 'clientCompany', null );
        self.set( 'clientAccount', null );
        if( !Ember.isEmpty( prefNum ) ){
            this.store.find( 'account-alias', { name: prefNum } ).then( function( prefAccts ){
                if( !Ember.isEmpty( prefAccts ) ){
                    var prefAcct = prefAccts.objectAt( 0 );
                    var findOptions = {
                        company: self.store.find( 'company', prefAcct.get( 'company_id' ) ),
                        account: self.store.find( 'account', prefAcct.get( 'account_id' ) ),
                    };
                    if( !Ember.isEmpty( prefAcct.get( 'client_company_id' ) ) ){
                        findOptions[ 'clientCompany' ] = self.store.find( 'company', prefAcct.get( 'client_company_id' ) );
                    }

                    if( !Ember.isEmpty( prefAcct.get( 'client_account_id' ) ) ){
                        findOptions[ 'clientAccount' ] = self.store.find( 'account', prefAcct.get( 'client_account_id' ) );
                    }
                    Ember.RSVP.hash( findOptions ).then( function( rsvpResults ){
                        self.set( 'wire.company_id', rsvpResults.company.id );
                        self.set( 'wire.company', rsvpResults.company );
                        self.set( 'wire.account_id', rsvpResults.account.id );
                        self.set( 'account', rsvpResults.account );
                        if( rsvpResults.hasOwnProperty( 'clientCompany' ) ){
                            self.set( 'clientCompany', rsvpResults.clientCompany );
                        }
                        if( rsvpResults.hasOwnProperty( 'clientAccount' ) ){
                            self.set( 'clientAccount', rsvpResults.clientAccount );
                        }
                    } );
                }
            } )
        }
    }.observes( 'wire.preferred_account_number' ),

    recalculateFee: function(){
        if( !Ember.isEmpty( this.get( 'wire.company_id' ) ) ){
            var self = this;
            self.store.find( 'company', self.get( 'wire.company_id' ) )
                .then( function( company ){
                    company.get( 'fees' ).then( function( fees ){
                        if( fees.length > 0 ){
                            var feeAmt = self.get( 'akxUtil' ).getWireFee( fees.objectAt( 0 ), self.get( 'wire' ) );
                            if( feeAmt < 0 ){
                                feeAmt = 0.00;
                            }
                            self.set( 'wire.fee', feeAmt );
                        }
                    } );
                } );
        }

    }.observes( 'wire.amount', 'wire.bank_country', 'wire.method', 'wire.account_id', 'wire.company_id' ),

    validations: {
        'wire.bank_route_id': {
            presence: true
        },
        'wire.bank_name': {
            presence: true
        },
        'wire.bank_country': {
            presence: true
        },
        'wire.account_id': {
            presence: true
        },
        'wire.company_id': {
            presence: true
        },
        'wire.account_holder': {
            presence: true
        },
        'wire.confirmation': {
            presence: true
        },
        'wire.amount': {
            presence: true
        },
        'wire.fee': {
            presence: true
        },
        'wire.reference': {
            presence: true
        },
        'wire.method': {
            presence: true
        },
    },

    actions: {

        updateWire: function(){
            var self = this;

            self.set( 'isLocked', true );

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

        holdWire: function(){
            var self = this;
            self.set( 'isLocked', true );
            self.set( 'wire.status', 4 );
            self.get( 'wire' ).save().then(
                function(){
                    self.set( 'isLocked', false );
                    self.notify.success( 'Wire updated.', { closeAfter: 5000 } );
                    self.container.lookup( 'route:dashboard.pending-in' ).refresh();
                    self.transitionToRoute( 'dashboard.pending-in' );
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
                },
                function( xhr ){
                    self.set( 'isLocked', false );
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                }
            );

        },

        completeWire: function( wire_id ){
            var self = this;
            this.validate().then(
                function(){
                    self.set( 'isLocked', true );

                    var payload = {
                        confirmation: self.get( 'wire.confirmation' ),
                        reference: self.get( 'wire.reference' ),
                        account_id: self.get( 'wire.account_id' ),
                        company_id: self.get( 'wire.company_id' ),
                        amount: Number( self.get( 'wire.amount' ) ),
                        fee: Number( self.get( 'wire.fee' ) ),
                        raw_data: self.get( 'wire.raw_data' )
                    };

                    self.get( 'wire' ).save().then(
                        function(){
                            Ember.$.ajax( {
                                url: config.APP.uber_api_host + '/wires/' + wire_id + '/complete',
                                type: 'post',
                                contentType: "application/json; charset=utf-8",
                                dataType: 'json',
                                data: JSON.stringify( { data: payload } )
                            } ).then(
                                function( response ){
                                    var route = self.container.lookup( 'route:dashboard.pending-in' );
                                    self.notify.success( 'Wire completed.', { closeAfter: 5000 } );
                                    route.refresh();
                                    self.transitionToRoute( 'dashboard.pending-in' );
                                },
                                function( xhr ){
                                    self.set( 'isLocked', false );
                                    self.get( 'akxUtil' ).handleError( xhr, {
                                        scope: self
                                    } );
                                } );
                        },
                        function( xhr ){
                            self.set( 'isLocked', false );
                            self.get( 'akxUtil' ).handleError( xhr, {
                                scope: self
                            } );
                        }
                    );
                },
                function(){

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
                    var route = self.container.lookup( 'route:dashboard.pending-in' );
                    self.notify.success( 'Transfer request has been cancelled.', { closeAfter: 5000 } );
                    route.refresh();
                    self.transitionToRoute( 'dashboard.pending-in' );
                },
                function( xhr ){
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                } );
        }

    }

} );
