import DS from 'ember-data';

export default DS.Model.extend( {
    name: DS.attr(),
    symbol: DS.attr(),
    bank_name: DS.attr(),
    account_name: DS.attr(),
    account_number: DS.attr(),
    swift_code: DS.attr(),
    intermediary_bank: DS.attr(),
    intermediary_swift: DS.attr(),
    aba_routing_number: DS.attr(),
    bank_address: DS.attr(),

    isUSD: function(){
        return this.get( 'id' ) === 'USD';
    }.property( 'id' ),

    isEUR: function(){
        return this.get( 'id' ) === 'EUR';
    }.property( 'id' ),

    isGBP: function(){
        return this.get( 'id' ) === 'GBP';
    }.property( 'id' )
} );