import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';

var locale = new Globalize( navigator.language );

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],

    sortProperties: [ 'getName' ],
    sortedTemps: Ember.computed.sort( 'templates', 'sortProperties' ),
    paneSecondary: 'companies/wires/wireout',
    useIntBank: false,

    wireMethods: [
        { label: 'Wire', val: 0 },
        { label: 'ACH', val: 1 }
    ],

    beneficiaryType: [
        { label: 'Individual', val: 0 },
        { label: 'Business', val: 1 }
    ],

    isUS: function(){
        return this.get( 'wire.bank_country' ) === 'US';
    }.property( 'wire.bank_country' ),

    isAccountHolderUS: function(){
        return this.get( 'wire.account_holder_country' ) === 'US';
    }.property( 'wire.account_holder_country' ),

    isIntermediaryUS: function(){
        return this.get( 'wire.intermediary_bank_country' ) === 'US';
    }.property( 'wire.intermediary_bank_country' ),

    isWire: function(){
        return this.get( 'wire.method' ) === 0;
    }.property( 'wire.method' ),

    isAch: function(){
        return this.get( 'wire.method' ) === 1;
    }.property( 'wire.method' ),

    isIndividual: function(){
        return this.get( 'wire.beneficiary_type' ) === 0;
    }.property( 'wire.beneficiary_type' ),


    methodSelected: function(){
        return ( this.get( 'wire.method' ) === 0 || this.get( 'wire.method' ) === 1 ) && this.get( 'wire.beneficiary_type' ) !== null;
    }.property( 'wire.method', 'wire.beneficiary_type' ),

    availableAccounts: function(){
        if( this.get( 'wire.method' ) === 1 ){
            return this.get( 'accounts' ).filterBy( 'currency_id', 'USD' );
        }
        else{
            return this.get( 'accounts' );
        }
    }.property( 'wire.method' ),

    available_amount: function(){
        if( !Ember.isEmpty( this.get( 'account' ) ) ){
            this.set( 'wire.currency_id', this.get( 'account.currency_id' ) );
            var availableAmt = Number( this.get( 'account.balance' ) ) - this.get( 'wire.fee' );

            if( availableAmt < 0 ){
                availableAmt = 0.00;
            }
            return availableAmt;
        }
        else{
            return 0.00;
        }
    }.property( 'wire.amount', 'wire.fee', 'account.id', 'account.currency_id' ),

    str_available_amount: function(){
        return locale.format( Number( this.get( 'available_amount' ) ), 'n2' );
    }.property( 'available_amount' ),

    str_method: function(){
        switch( this.get( 'wire.method' ) ){
            case 0:
                return "WIRE";
            case 1:
                return "ACH";
        }
    }.property( 'wire.type' ),

    validACH: function(){
        if( this.get( 'wire.method' ) === 1 && this.get( 'wire.amount' ) > 3000 ){
            this.set( 'wire.amount', 3000 );
        }

    }.observes( 'wire.method', 'wire.amount' ),

    validSWIFT: function(){
        if( !Ember.isEmpty( this.get( 'wire.code_swift' ) ) ){
            this.set( 'wire.code_swift', this.get( 'wire.code_swift' ).toUpperCase() );
        }
        if( !Ember.isEmpty( this.get( 'wire.intermediary_bank_code_swift' ) ) ){
            this.set( 'wire.intermediary_bank_code_swift', this.get( 'wire.intermediary_bank_code_swift' ).toUpperCase() );
        }
    }.observes( 'wire.code_swift', 'wire.intermediary_bank_code_swift' ),

    validIBAN: function(){
        if( !Ember.isEmpty( this.get( 'wire.account_iban' ) ) ){
            this.set( 'wire.account_iban', this.get( 'wire.account_iban' ).toUpperCase() );
        }
    }.observes( 'wire.account_iban' ),

    clearCodeABA: function(){
        if( !Ember.isEmpty( this.get( 'wire.bank_country' ) ) && this.get(' wire.bank_country') !== 'US' ){
            this.set( 'wire.code_aba', null );
        }
    }.observes( 'wire.bank_country'),

    methodChanged: function(){
        if( this.get( 'wire.method' ) === 1 ){
            this.set( 'wire.bank_country', 'US' );
            this.set( 'templates', this.get( 'allTemplates' ).filterBy( 'bank_country', 'US' ) );
        }
        else{
            this.set( 'templates', this.get( 'allTemplates' ) );
        }
    }.observes( 'wire.method' ),

    fee_amount: function(){
        var feeAmt = 0;

        if( !Ember.isEmpty( this.get( 'account' ) ) && !Ember.isEmpty( this.get( 'account.company.fees' ).objectAt( 0 ) ) ){
            this.set( 'wire.currency_id', this.get( 'account.currency_id' ) );
            this.set( 'wire.type', 0 );
            feeAmt = this.get( 'akxUtil' ).getWireFee( this.get( 'account.company.fees' ).objectAt( 0 ), this.get( 'wire' ) );

            if( feeAmt < 0 ){
                feeAmt = 0.00;
            }
        }

        this.set( 'wire.fee', feeAmt );
    }.observes( 'wire.amount', 'wire.bank_country', 'wire.method', 'wire.speedwire', 'account.id', 'account.company.fees.@each.fee_data' ),

    allowIntBank: function(){
        var wireType = this.get( 'wire.type' );
        var wireMethod = this.get( 'wire.method' );
        var wireCurrency = this.get( 'wire.currency_id' );
        if( wireType === 0 && wireMethod === 0 && wireCurrency === 'USD' ){
            return true;
        }
        else{
            this.set( 'useIntBank', false );
            return false;
        }
    }.property( 'wire.currency_id', 'wire.method', 'wire.type' ),

    validations: {
        'wire.intermediary_bank_name': {
            presence: {
                'if': function( obj, validator ){
                    if( obj.get( 'allowIntBank' ) && obj.get( 'useIntBank' ) ){
                        return true;
                    }
                }
            }
        },
        'wire.intermediary_bank_code_aba': {
            presence: {
                'if': function( obj, validator ){
                    if( obj.get( 'allowIntBank' ) && obj.get( 'useIntBank' ) ){
                        if( Ember.isEmpty( obj.get( 'wire.intermediary_bank_code_aba' ) ) && Ember.isEmpty( obj.get( 'wire.intermediary_bank_code_swift' ) ) ){
                            return true;
                        }
                    }
                }
            },
            length: {
                maximum: 11
            },
            validAba: true
        },

        'wire.intermediary_bank_code_swift': {
            presence: {
                'if': function( obj, validator ){
                    if( obj.get( 'allowIntBank' ) && obj.get( 'useIntBank' ) ){
                        if( Ember.isEmpty( obj.get( 'wire.intermediary_bank_code_aba' ) ) && Ember.isEmpty( obj.get( 'wire.intermediary_bank_code_swift' ) ) ){
                            return true;
                        }
                    }
                }
            },
            length: {
                maximum: 11
            },
            validSwift: true
        },

        'wire.intermediary_bank_country': {
            presence: {
                'if': function( obj, validator ){
                    if( obj.get( 'allowIntBank' ) && obj.get( 'useIntBank' ) ){
                        return true;
                    }
                }
            }
        },
        'wire.intermediary_bank_address': {
            length: {
                maximum: 35
            }
        },
        'wire.intermediary_bank_city': {
            length: {
                maximum: 25
            }
        },
        'wire.intermediary_bank_state_province': {
            length: {
                maximum: 3
            }
        },
        'wire.intermediary_bank_postal_code': {
            length: {
                maximum: 9
            },
            format: {
                with: /^([a-zA-Z]|\d)+$/,
                allowBlank: true,
                message: 'must be letters and numbers only'
            }
        },
        'wire.method': {
            presence: true
        },
        'wire.bank_name': {
            presence: true,
            length: {
                maximum: 35
            }
        },
        'wire.bank_country': {
            presence: true,
            inline: EmberValidations.validator( function(){
                if( this.model.get( 'wire.method' ) === 1 && this.model.get( 'wire.bank_country' ) !== 'US' ){
                    return 'Bank country cannot be ' + this.model.get( 'wire.bank_country' ) + ' when using ACH';
                }
            } )
        },
        'wire.bank_address': {
            presence: true,
            length: {
                maximum: 35
            }
        },
        'wire.bank_city': {
            presence: true,
            length: {
                maximum: 25
            }
        },
        'wire.bank_state_province': {
            presence: true,
            length: {
                maximum: 3
            }
        },
        'wire.bank_postal_code': {
            presence: true,
            length: {
                maximum: 9
            },
            format: {
                with: /^([a-zA-Z]|\d)+$/,
                allowBlank: true,
                message: 'must be letters and numbers only'
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
            },
            length: {
                maximum: 11
            },
            validSwift: true
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
            },
            length: {
                maximum: 11
            },
            validAba: true
        },
        'wire.account_id': {
            presence: true
        },
        'wire.account_holder': {
            presence: true,
            length: {
                maximum: 60
            }
        },
        'wire.account_number': {
            presence: true,
            length: {
                maximum: 34
            }
        },
        'wire.beneficiary_type': {
            presence: true
        },
        'wire.account_holder_dob': {
            presence: {
                'if': function( obj ){
                    var benType = obj.get( 'wire.beneficiary_type' );
                    return benType === 0;
                }
            },
            length: {
                maximum: 10
            }
        },
        'wire.account_holder_nationality': {
            presence: {
                'if': function( obj ){
                    var benType = obj.get( 'wire.beneficiary_type' );
                    return benType === 0;
                }
            }
        },
        'wire.account_holder_address': {
            presence: true,
            length: {
                maximum: 55
            }
        },
        'wire.account_holder_city': {
            presence: true,
            length: {
                maximum: 30
            }
        },
        'wire.account_holder_state_province': {
            length: {
                maximum: 3
            }
        },
        'wire.account_holder_postal_code': {
            length: {
                maximum: 9
            }
        },
        'wire.account_holder_country': {
            presence: true,
            length: {
                maximum: 2
            }
        },
        'wire.amount': {
            presence: true,
            numericality: {
                greaterThan: 0,
                lessThanOrEqualTo: 'available_amount',
                messages: {
                    lessThanOrEqualTo: 'Amount must be less than available balance'
                }
            }
        },
        'wire.fee': {
            presence: true,
            numericality: {
                greaterThanOrEqualTo: 0
            }
        },
        'wire.account_iban': {
            length: {
                maximum: 34
            },
            validIban: true

        },
        'wire.code_irc': {
            length: {
                maximum: 24
            }
        },
        'wire.purpose': {
            presence: true
        }
    },

    selectTemplate: function(){
        if( this.get( 'template_id' ) && !Ember.isEmpty( this.get( 'templates' ) ) ){
            var template = this.get( 'templates' ).filterBy( 'id', this.get( 'template_id' ) ).objectAt( 0 );
            this.setProperties( {
                'wire.bank_name': template.get( 'bank_name' ),
                'wire.bank_address': template.get( 'bank_address' ),
                'wire.bank_city': template.get( 'bank_city' ),
                'wire.bank_state_province': template.get( 'bank_state_province' ),
                'wire.bank_postal_code': template.get( 'bank_postal_code' ),
                'wire.bank_country': template.get( 'bank_country' ),
                'wire.bank_phone': template.get( 'bank_phone' ),
                'wire.code_swift': template.get( 'code_swift' ),
                'wire.code_aba': template.get( 'code_aba' ),
                'wire.code_irc': template.get( 'code_irc' ),
                'wire.account_holder': template.get( 'account_holder' ),
                'wire.account_number': template.get( 'account_number' ),
                'wire.account_holder_dob': template.get( 'account_holder_dob' ),
                'wire.account_holder_nationality': template.get( 'account_holder_nationality' ),
                'wire.account_holder_address': template.get( 'account_holder_address' ),
                'wire.account_holder_city': template.get( 'account_holder_city' ),
                'wire.account_holder_state_province': template.get( 'account_holder_state_province' ),
                'wire.account_holder_postal_code': template.get( 'account_holder_postal_code' ),
                'wire.account_holder_country': template.get( 'account_holder_country' ),
                'wire.account_iban': template.get( 'account_iban' ),
                'wire.notes': template.get( 'notes' ),
                'wire.purpose': template.get( 'purpose' ),
                'wire.intermediary_bank_name': template.get( 'intermediary_bank_name' ),
                'wire.intermediary_bank_country': template.get( 'intermediary_bank_country' ),
                'wire.intermediary_bank_address': template.get( 'intermediary_bank_address' ),
                'wire.intermediary_bank_city': template.get( 'intermediary_bank_city' ),
                'wire.intermediary_bank_state_province': template.get( 'intermediary_bank_state_province' ),
                'wire.intermediary_bank_postal_code': template.get( 'intermediary_bank_postal_code' ),
                'wire.intermediary_bank_code_aba': template.get( 'intermediary_bank_code_aba' ),
                'wire.intermediary_bank_code_swift': template.get( 'intermediary_bank_code_swift' )
            } );
            if( this.get( 'account.currency_id' ) === 'USD' && this.get( 'wire.method' ) === 0 && template.get( 'intermediary_bank_name' ) ){
                this.set( 'useIntBank', true );
            }
        }
    }.observes( 'template_id', 'account.currency_id', 'wire.method' ),

    clearIntBank: function(){
        if( !this.get( 'useIntBank' ) ){
            this.set( 'wire.intermediary_bank_name', null );
            this.set( 'wire.intermediary_bank_country', null );
            this.set( 'wire.intermediary_bank_address', null );
            this.set( 'wire.intermediary_bank_city', null );
            this.set( 'wire.intermediary_bank_state_province', null );
            this.set( 'wire.intermediary_bank_postal_code', null );
            this.set( 'wire.intermediary_bank_code_swift', null );
            this.set( 'wire.intermediary_bank_code_aba', null );
        }
    }.observes( 'useIntBank' ),

    actions: {
        stepBack: function(){
            this.set( 'paneSecondary', 'companies/wires/wireout' );
        },

        confirmation: function(){
            var self = this;
            self.set( 'isLocked', true );
            if( !self.get( 'useIntBank' ) ){
                self.set( 'wire.intermediary_bank_name', null );
                self.set( 'wire.intermediary_bank_country', null );
                self.set( 'wire.intermediary_bank_address', null );
                self.set( 'wire.intermediary_bank_city', null );
                self.set( 'wire.intermediary_bank_state_province', null );
                self.set( 'wire.intermediary_bank_postal_code', null );
                self.set( 'wire.intermediary_bank_code_swift', null );
                self.set( 'wire.intermediary_bank_code_aba', null );
            }
            self.validate().then(
                function(){
                    var payload = {
                        company_id: self.get( 'account.company_id' ),
                        amount: self.get( 'wire.amount' ),
                        type: 0
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
                        self.set( 'paneSecondary', 'companies/wires/wireout-confirmation' );
                    } );

                },
                function(){
                }
            )
        },

        createWireOut: function(){
            var self = this;
            var wireData = {
                account_id: self.get( 'wire.account_id' ),
                currency_id: self.get( 'account.currency_id' ),
                beneficiary_type: self.get( 'wire.beneficiary_type' ),
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
                code_reference: self.get( 'wire.code_reference' ),
                account_holder: self.get( 'wire.account_holder' ),
                account_number: self.get( 'wire.account_number' ),
                account_holder_dob: self.get( 'wire.account_holder_dob' ),
                account_holder_nationality: self.get( 'wire.account_holder_nationality' ),
                account_holder_address: self.get( 'wire.account_holder_address' ),
                account_holder_city: self.get( 'wire.account_holder_city' ),
                account_holder_state_province: self.get( 'wire.account_holder_state_province' ),
                account_holder_postal_code: self.get( 'wire.account_holder_postal_code' ),
                account_holder_country: self.get( 'wire.account_holder_country' ),
                account_iban: self.get( 'wire.account_iban' ),
                amount: self.get( 'wire.amount' ),
                notes: self.get( 'wire.notes' ),
                notes_akirix: self.get( 'wire.notes_akirix' ),
                speedwire: self.get( 'wire.speedwire' ),
                type: 0,
                method: self.get( 'wire.method' ),
                fee: self.get( 'wire.fee' ),
                purpose: self.get( 'wire.purpose' )
            };

            if( this.get( 'useIntBank' ) ){
                wireData.intermediary_bank_code_swift = self.get( 'wire.intermediary_bank_code_swift' );
                wireData.intermediary_bank_code_aba = self.get( 'wire.intermediary_bank_code_aba' );
                wireData.intermediary_bank_name = self.get( 'wire.intermediary_bank_name' );
                wireData.intermediary_bank_address = self.get( 'wire.intermediary_bank_address' );
                wireData.intermediary_bank_city = self.get( 'wire.intermediary_bank_city' );
                wireData.intermediary_bank_state_province = self.get( 'wire.intermediary_bank_state_province' );
                wireData.intermediary_bank_postal_code = self.get( 'wire.intermediary_bank_postal_code' );
                wireData.intermediary_bank_country = self.get( 'wire.intermediary_bank_country' )
            }

            var newWire = self.store.createRecord( 'wire', wireData );

            newWire.save().then(
                function(){
                    self.set( 'isLocked', false );
                    self.notify.success( 'Withdrawal request submitted.', { closeAfter: 5000 } );
                    var route = self.container.lookup( 'route:companies.view.wires' );
                    route.refresh();
                    self.transitionToRoute( 'companies.view.wires' );
                },
                function( xhr ){
                    self.set( 'isLocked', false );
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                }
            );
        }
    }
} );

