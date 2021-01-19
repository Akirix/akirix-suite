import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';
import _ from "lodash/lodash";

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],

    paneSecondary: 'companies/wires/wirein',

    wireMethods: [
        { label: 'Wire', val: 0 },
        { label: 'ACH', val: 1 }
    ],

    validations: {
        'wire.bank_name': {
            presence: true

        },
        'wire.bank_country': {
            presence: true
        },
        'wire.account_id': {
            presence: true
        },
        'wire.account_holder': {
            presence: true
        },
        'wire.method': {
            presence: true
        },
        'wire.amount': {
            presence: true,
            numericality: {
                greaterThan: 0
            }
        },
        'wire.fee': {
            presence: true,
            numericality: {
                greaterThanOrEqualTo: 0
            }
        }
    },

    selectTemplate: function(){
        var self = this;
        if( this.get( 'template_id' ) !== null ){
            this.store.find( 'wire-template', this.get( 'template_id' ) ).then( function( template ){
                self.set( 'wire.bank_name', template.get( 'bank_name' ) );
                self.set( 'wire.bank_address', template.get( 'bank_address' ) );
                self.set( 'wire.bank_city', template.get( 'bank_city' ) );
                self.set( 'wire.bank_state_province', template.get( 'bank_state_province' ) );
                self.set( 'wire.bank_postal_code', template.get( 'bank_postal_code' ) );
                self.set( 'wire.bank_country', template.get( 'bank_country' ) );
                self.set( 'wire.bank_phone', template.get( 'bank_phone' ) );
                self.set( 'wire.code_swift', template.get( 'code_swift' ) );
                self.set( 'wire.code_aba', template.get( 'code_aba' ) );
                self.set( 'wire.code_irc', template.get( 'code_irc' ) );
                self.set( 'wire.account_holder', template.get( 'account_holder' ) );
                self.set( 'wire.account_number', template.get( 'account_number' ) );
            } );
        }
    }.observes( 'template_id' ),

    fee_amount: function(){
        var feeAmt = 0;

        if( !Ember.isEmpty( this.get( 'account' ) ) && !Ember.isEmpty( this.get( 'account.company.fees' ).objectAt( 0 ) ) ){
            this.set( 'wire.currency_id', this.get( 'account.currency_id' ) );
            feeAmt = this.get( 'akxUtil' ).getWireFee( this.get( 'account.company.fees' ).objectAt( 0 ), this.get( 'wire' ) );

            if( feeAmt < 0 ){
                feeAmt = 0.00;
            }
        }

        this.set( 'wire.fee', feeAmt );
    }.observes( 'wire.amount', 'wire.bank_country', 'wire.method', 'account.id', 'account.company.fees.@each.fee_data' ),


    actions: {
        stepBack: function(){
            this.set( 'paneSecondary', 'companies/wires/wirein' );
        },

        confirmation: function(){
            var self = this;
            self.set( 'isLocked', true );
            self.validate().then(
                function(){
                    var payload = {
                        company_id: self.get( 'accounts.query.company_id' ),
                        amount: self.get( 'wire.amount' ),
                        type: 1
                    };
                    Ember.$.ajax( {
                        url: config.APP.uber_api_host + '/companies/' + self.get( 'account.company_id' ) + '/duplicateWiresCheck',
                        type: 'POST',
                        contentType: "application/json; charset=utf-8",
                        dataType: 'json',
                        data: JSON.stringify( payload )
                    } ).done( function( res ){
                        var dupWires = [];
                        res.wires.forEach( function( wire ){
                            dupWires.push( self.store.push( 'wire', self.store.normalize( 'wire', wire ) ) );
                        } );
                        self.set( 'duplicateWires', dupWires );
                        self.set( 'paneSecondary', 'companies/wires/wirein-confirmation' );
                    } );

                },
                function(){}
            );
        },

        createWireIn: function(){
            var self = this;
            var newWire = self.store.createRecord( 'wire', {
                account_id: self.get( 'wire.account_id' ),
                bank_name: self.get( 'wire.bank_name' ),
                bank_address: self.get( 'wire.bank_address' ),
                bank_city: self.get( 'wire.bank_city' ),
                bank_state_province: self.get( 'wire.bank_state_province' ),
                bank_postal_code: self.get( 'wire.bank_postal_code' ),
                bank_country: self.get( 'wire.bank_country' ),
                bank_phone: self.get( 'wire.bank_phone' ),
                code_swift: self.get( 'wire.code_swift' ),
                code_aba: self.get( 'wire.code_aba' ),
                code_irc: self.get( 'wire.code_irc' ),
                account_holder: self.get( 'wire.account_holder' ),
                account_number: self.get( 'wire.account_number' ),
                account_iban: self.get( 'wire.account_iban' ),
                amount: self.get( 'wire.amount' ),
                type: 1,
                method: self.get( 'wire.method' ),
                fee: self.get( 'wire.fee' )
            } );

            newWire.save().then(
                function(){
                    self.set( 'isLocked', false );
                    self.notify.success( 'Deposit notification submitted.', { closeAfter: 5000 } );
                    var route = self.container.lookup( 'route:companies.view.wires' );
                    route.refresh();
                    self.transitionToRoute( 'companies.view.wires' );
                },
                function( xhr ){
                    self.set( 'isLocked', false );
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );

                    self.set( 'isLocked', false );
                }
            );
        }
    }
} );
