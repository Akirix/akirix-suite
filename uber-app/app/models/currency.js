import DS from 'ember-data';

export default DS.Model.extend( {
    name: DS.attr(),
    symbol: DS.attr(),

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