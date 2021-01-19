import DS from 'ember-data';

export default DS.Model.extend( {
    invoice_id: DS.attr(),
    name: DS.attr(),
    unit: DS.attr(),
    price: DS.attr( 'number' ),
    quantity: DS.attr( 'number' ),

    invoice: DS.belongsTo( 'invoice', { async: true } ),

    total: function(){
        var total =  Number( this.get( 'price' ) * this.get( 'quantity' ) );
        if( isNaN( total ) ){
            return 0.00;
        }
        else{
            return total;
        }
    }.property( 'price', 'quantity' )
} );

