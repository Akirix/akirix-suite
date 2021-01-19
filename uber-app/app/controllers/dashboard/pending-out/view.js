import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';
var locale = new Globalize( navigator.language );

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],
    useIntBank: false,

    wireMethods: [
        { label: 'Wire', val: 0 },
        { label: 'ACH', val: 1 }
    ],

    beneficiaryType: [
        { label: 'Personal', val: 0 },
        { label: 'Business', val: 1 }
    ],

    isUS: function(){
        return this.get( 'wire.bank_country' ) === 'US';
    }.property( 'wire.bank_country' ),

    isAccountHolderUS: function(){
        return this.get( 'wire.account_holder_country' ) === 'US';
    }.property( 'wire.account_holder_country' ),

    isWire: function(){
        return this.get( 'wire.method' ) === 0;
    }.property( 'wire.method' ),

    isIndividual: function(){
        return this.get( 'wire.beneficiary_type' ) === 0;
    }.property( 'wire.beneficiary_type' ),

    isIntermediaryUS: function(){
        return this.get( 'wire.intermediary_bank_country' ) === 'US';
    }.property( 'wire.intermediary_bank_country' ),

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
        }
    }.observes( 'wire.method' ),

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
        'wire.bank_route_id': {
            presence: true
        },
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
            validAba: true
        },
        'wire.account_iban': {
            length: {
                maximum: 34
            },
            validIban: true

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
        'wire.account_holder_dob': {
            presence: {
                'if': function( obj ){
                    var benType = obj.get( 'wire.beneficiary_type' );
                    return benType === 0;
                }
            },
            length: {
                maximum: 34
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
        'wire.purpose': {
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
        goBack: function(){
            Ember.$( 'tr.active' ).removeClass( 'active' );
            return true;
        },

        startWire: function(){
            var self = this;
            this.validate().then(
                function(){
                    self.set( 'isLocked', true );
                    self.set( 'wire.status', 1 );
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
                function(){

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
                    self.container.lookup( 'route:dashboard.pending-out' ).refresh();
                    self.transitionToRoute( 'dashboard.pending-out' );
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

        updateWire: function(){
            var self = this;

            this.validate().then(
                function(){
                    self.set( 'isLocked', true );
                    var theWire = self.get( 'wire' );
                    if( !self.get( 'useIntBank' ) ){
                        theWire.set( 'intermediary_bank_code_swift', null );
                        theWire.set( 'intermediary_bank_code_aba', null );
                        theWire.set( 'intermediary_bank_name', null );
                        theWire.set( 'intermediary_bank_address', null );
                        theWire.set( 'intermediary_bank_city', null );
                        theWire.set( 'intermediary_bank_state_province', null );
                        theWire.set( 'intermediary_bank_postal_code', null );
                        theWire.set( 'intermediary_bank_country', null );
                    }

                    theWire.save().then(
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
                function(){

                }
            );
        },

        completeWire: function( wire_id ){
            var self = this;
            this.validate().then(
                function(){
                    self.set( 'isLocked', true );
                    var payload = {
                        confirmation: self.get( 'wire.confirmation' )
                    };
                    Ember.$.ajax( {
                        url: config.APP.uber_api_host + '/wires/' + wire_id + '/complete',
                        type: 'post',
                        contentType: "application/json; charset=utf-8",
                        dataType: 'json',
                        data: JSON.stringify( { data: payload } )
                    } ).then(
                        function( response ){
                            var route = self.container.lookup( 'route:dashboard.pending-out' );
                            self.notify.success( 'Wire completed.', { closeAfter: 5000 } );
                            route.refresh();
                            self.transitionToRoute( 'dashboard.pending-out' );
                        },
                        function( xhr ){
                            self.get( 'akxUtil' ).handleError( xhr, {
                                scope: self
                            } );
                        } );
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
                    var route = self.container.lookup( 'route:dashboard.pending-out' );
                    self.notify.success( 'Transfer request has been cancelled.', { closeAfter: 5000 } );
                    route.refresh();
                    self.transitionToRoute( 'dashboard.pending-out' );
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
                    var route = self.container.lookup( 'route:dashboard.pending-out' );
                    self.notify.success( 'Transfer request has been rejected.', { closeAfter: 5000 } );
                    route.refresh();
                    self.transitionToRoute( 'dashboard.pending-out' );
                },
                function( xhr ){
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                } );
        }
    }

} );
