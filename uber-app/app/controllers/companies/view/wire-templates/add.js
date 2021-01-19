import Ember from 'ember';
import EmberValidations from 'ember-validations';
var locale = new Globalize( navigator.language );

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],
    useIntBank: false,

    beneficiaryType: [
        { label: 'Individual', val: 0 },
        { label: 'Business', val: 1 }
    ],

    validations: {
        'wireTemplate.intermediary_bank_name': {
            presence: {
                'if': function( obj, validator ){
                    if( obj.get( 'useIntBank' ) ){
                        return true;
                    }
                }
            }
        },
        'wireTemplate.intermediary_bank_country': {
            presence: {
                'if': function( obj, validator ){
                    if( obj.get( 'useIntBank' ) ){
                        return true;
                    }
                }
            }
        },
        'wireTemplate.intermediary_bank_code_aba': {
            presence: {
                'if': function( obj, validator ){
                    if( obj.get( 'useIntBank' ) ){
                        if( Ember.isEmpty( obj.get( 'wireTemplate.intermediary_bank_code_aba' ) ) && Ember.isEmpty( obj.get( 'wireTemplate.intermediary_bank_code_swift' ) ) ){
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
        'wireTemplate.intermediary_bank_code_swift': {
            presence: {
                'if': function( obj, validator ){
                    if( obj.get( 'useIntBank' ) ){
                        if( Ember.isEmpty( obj.get( 'wireTemplate.intermediary_bank_code_aba' ) ) && Ember.isEmpty( obj.get( 'wireTemplate.intermediary_bank_code_swift' ) ) ){
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
        'wireTemplate.intermediary_bank_address': {
            length: {
                maximum: 35
            }
        },
        'wireTemplate.intermediary_bank_city': {
            length: {
                maximum: 25
            }
        },
        'wireTemplate.intermediary_bank_state_province': {
            length: {
                maximum: 3
            }
        },
        'wireTemplate.intermediary_bank_postal_code': {
            length: {
                maximum: 9
            },
            format: {
                with: /^([a-zA-Z]|\d)+$/,
                allowBlank: true,
                message: 'must be letters and numbers only'
            }
        },
        'wireTemplate.bank_name': {
            presence: true,
            length: {
                maximum: 35
            }
        },
        'wireTemplate.bank_country': {
            presence: true

        },
        'wireTemplate.code_swift': {
            presence: {
                if: function( obj, validator ){
                    if( Ember.isEmpty( obj.get( 'wireTemplate.code_aba' ) ) && Ember.isEmpty( obj.get( 'wireTemplate.code_swift' ) ) ){
                        return true;
                    }
                    else{
                        return false;
                    }
                }
            },
            length: {
                maximum: 11
            },
            validSwift: true
        },
        'wireTemplate.code_aba': {
            presence: {
                if: function( obj, validator ){
                    if( Ember.isEmpty( obj.get( 'wireTemplate.code_aba' ) ) && Ember.isEmpty( obj.get( 'wireTemplate.code_swift' ) ) ){
                        return true;
                    }
                    else{
                        return false;
                    }
                }
            },
            length: {
                maximum: 11
            },
            validAba: true
        },

        'wireTemplate.account_holder': {
            presence: true,
            length: {
                maximum: 60
            }
        },
        'wireTemplate.account_number': {
            presence: true,
            length: {
                maximum: 34
            }
        },
        'wireTemplate.bank_address': {
            presence: true,
            length: {
                maximum: 55
            }
        },
        'wireTemplate.bank_city': {
            presence: true,
            length: {
                maximum: 30
            }
        },
        'wireTemplate.bank_state_province': {
            presence: true,
            length: {
                maximum: 3
            }
        },
        'wireTemplate.bank_postal_code': {
            presence: true,
            length: {
                maximum: 9
            }
        },
        'wireTemplate.beneficiary_type': {
            presence: true
        },
        'wireTemplate.account_holder_dob': {
            presence: {
                'if': function( obj ){
                    var benType = obj.get( 'wireTemplate.beneficiary_type' );
                    return benType === 0;
                }
            },
            length: {
                maximum: 10
            }
        },
        'wireTemplate.account_holder_address': {
            presence: true,
            length: {
                maximum: 55
            }
        },
        'wireTemplate.account_holder_city': {
            presence: true,
            length: {
                maximum: 30
            }
        },
        'wireTemplate.account_holder_state_province': {
            length: {
                maximum: 3
            }
        },
        'wireTemplate.account_holder_postal_code': {
            length: {
                maximum: 9
            }
        },
        'wireTemplate.account_holder_country': {
            presence: true,
            length: {
                maximum: 2
            }
        },
        'wireTemplate.account_holder_nationality': {
            presence: {
                'if': function( obj ){
                    var benType = obj.get( 'wireTemplate.beneficiary_type' );
                    return benType === 0;
                }
            }
        },

        'wireTemplate.account_iban': {
            length: {
                maximum: 34
            },
            validIban: true
        },
        'wireTemplate.code_irc': {
            length: {
                maximum: 24
            }
        },
        'wireTemplate.purpose': {
            presence: true
        }
    },

    isCanadian: function(){
        return this.get( 'wireTemplate.bank_country' ) === 'CA';
    }.property( 'wireTemplate.bank_country' ),

    isUS: function(){
        return this.get( 'wireTemplate.bank_country' ) === 'US';
    }.property( 'wireTemplate.bank_country' ),

    isAccountHolderUS: function(){
        return this.get( 'wireTemplate.account_holder_country' ) === 'US';
    }.property( 'wireTemplate.account_holder_country' ),

    isIntermediaryUS: function(){
        return this.get( 'wireTemplate.intermediary_bank_country' ) === 'US';
    }.property( 'wireTemplate.intermediary_bank_country' ),

    isIndividual: function(){
        return this.get( 'wireTemplate.beneficiary_type' ) === 0;
    }.property( 'wireTemplate.beneficiary_type' ),

    validSWIFT: function(){
        if( !Ember.isEmpty( this.get( 'wireTemplate.code_swift' ) ) ){
            this.set( 'wireTemplate.code_swift', this.get( 'wireTemplate.code_swift' ).toUpperCase() );
        }
        if( !Ember.isEmpty( this.get( 'wireTemplate.intermediary_bank_code_swift' ) ) ){
            this.set( 'wireTemplate.intermediary_bank_code_swift', this.get( 'wireTemplate.intermediary_bank_code_swift' ).toUpperCase() );
        }
    }.observes( 'wireTemplate.code_swift', 'wireTemplate.intermediary_bank_code_swift' ),

    validIBAN: function(){
        if( !Ember.isEmpty( this.get( 'wireTemplate.account_iban' ) ) ){
            this.set( 'wireTemplate.account_iban', this.get( 'wireTemplate.account_iban' ).toUpperCase() );
        }
    }.observes( 'wireTemplate.account_iban' ),

    actions: {
        addTemplate: function(){
            var self = this;
            if( !self.get( 'useIntBank' ) ){
                self.set( 'wireTemplate.intermediary_bank_country', null );
                self.set( 'wireTemplate.intermediary_bank_name', null );
                self.set( 'wireTemplate.intermediary_bank_address', null );
                self.set( 'wireTemplate.intermediary_bank_city', null );
                self.set( 'wireTemplate.intermediary_bank_state_province', null );
                self.set( 'wireTemplate.intermediary_bank_postal_code', null );
                self.set( 'wireTemplate.intermediary_bank_code_swift', null );
                self.set( 'wireTemplate.intermediary_bank_code_aba', null );
            }
            this.validate().then(
                function(){
                    var newTemplate = self.store.createRecord( 'wire-template', self.get( 'wireTemplate' ) );

                    self.set( 'isLocked', true );

                    newTemplate.save().then(
                        function(){
                            self.set( 'isLocked', false );
                            self.notify.success( 'Wire Template created.', { closeAfter: 10000 } );
                            var route = self.container.lookup( 'route:companies.view.wire-templates' );
                            route.refresh();
                            self.transitionToRoute( 'companies.view.wire-templates' );
                        },
                        function( xhr ){
                            self.get( 'akxUtil' ).handleError( xhr, {
                                scope: self
                            } );

                            self.set( 'isLocked', false );
                        }
                    );
                },
                function(){

                }
            );
        }
    }
} );

