import DS from 'ember-data';

export default DS.Model.extend( {
    company_id: DS.attr(),
    fee_data: DS.attr(),
    company: DS.belongsTo( 'company', { async: true } ),

    fee_invoice_in: function(){
        return JSON.parse( this.get( 'fee_data' ) ).invoice.in;
    }.property( 'fee_data' ),

    fee_invoice_out: function(){
        return JSON.parse( this.get( 'fee_data' ) ).invoice.out;
    }.property( 'fee_data' ),

    fee_loan: function(){
        return JSON.parse( this.get( 'fee_data' ) ).loan;
    }.property( 'fee_data' ),

    fee_book_transfer: function(){
        return JSON.parse( this.get( 'fee_data' ) ).book_transfer;
    }.property( 'fee_data' )
} );

