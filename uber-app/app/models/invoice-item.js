import DS from 'ember-data';
var locale = new Globalize( navigator.language );

export default DS.Model.extend( {
    invoice_id: DS.attr(),

    name: DS.attr(),
    unit: DS.attr(),
    price: DS.attr( 'number' ),
    quantity: DS.attr( 'number' ),
    errors: DS.attr(),

    invoice: DS.belongsTo( 'invoice', { async: true } ),

    total: function(){
        var total = math.round( Number( this.get( 'price' ) * this.get( 'quantity' ) ), 2 );
        if( isNaN( total ) ){
            return 0.00;
        }
        else{
            return total;
        }
    }.property( 'price', 'quantity' ),

    str_price: function(){
        return locale.format( Number( this.get( 'price' ) ), 'n5' );
    }.property( 'price' ),

    str_total: function(){
        return locale.format( Number( this.get( 'total' ) ), 'n2' );
    }.property( 'total' )

} );

