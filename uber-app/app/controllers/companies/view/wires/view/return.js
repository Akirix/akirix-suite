import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';
import _ from "lodash/lodash";

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],

    paneSecondary: 'companies/wires/wirein',

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
        },
        'wire.notes': {
            presence: true
        },
        'wire.raw_data': {
            presence: true
        }
    },

    actions: {
        createWireIn: function(){
            var self = this;
            var newWire = self.store.createRecord( 'wire', {
                parent_id: self.get( 'wire.parent_id' ),
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
                fee: self.get( 'wire.fee' ),
                notes: self.get( 'wire.notes' ),
                raw_data: self.get( 'wire.raw_data' )
            } );

            newWire.save().then(
                function(){
                    self.set( 'isLocked', false );
                    self.notify.success( 'Return wire submitted.', { closeAfter: 5000 } );
                    self.send( 'goBack' );
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

