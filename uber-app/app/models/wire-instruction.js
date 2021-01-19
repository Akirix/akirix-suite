import Ember from 'ember';
import DS from 'ember-data';

export default DS.Model.extend( {
    currency_id: DS.attr(),
    name: DS.attr(),
    bank_name: DS.attr(),
    bank_address: DS.attr(),
    aba_routing_number: DS.attr(),
    swift_code: DS.attr(),
    sort_code: DS.attr(),
    account_holder: DS.attr(),
    account_number: DS.attr(),
    account_iban: DS.attr(),
    intermediary_bank_name: DS.attr(),
    intermediary_bank_address: DS.attr(),
    intermediary_swift: DS.attr(),
    intermediary_aba_routing_number: DS.attr(),
    type: DS.attr(),
    preferred: DS.attr(),

    domestic: DS.attr( 'number' ),
    international: DS.attr( 'number' ),
    method_wire: DS.attr( 'number' ),
    method_ach: DS.attr( 'number' ),

    currency: DS.belongsTo( 'currency', { async: true } ),

    strMethodAch: function(){
        return this.get( 'method_ach' ) === 1 ? 'Yes' : 'No'
    }.property( 'method_ach' ),
    strMethodWire: function(){
        return this.get( 'method_wire' ) === 1 ? 'Yes' : 'No'
    }.property( 'method_wire' ),
} );
