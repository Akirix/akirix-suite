import DS from 'ember-data';

export default DS.Model.extend( {
    company_id: DS.attr(),
    currency_id: DS.attr(),
    created_at: DS.attr(),

    name: DS.attr(),
    balance: DS.attr(),
    balance_hold: DS.attr(),
    points_in: DS.attr(),
    points_out: DS.attr(),
    points_out_cash: DS.attr(),
    pending_in: DS.attr(),
    pending_out: DS.attr(),
    type: DS.attr(),

    currency: DS.belongsTo( 'currency', { async: true } ),
    company: DS.belongsTo( 'company', { async: true } ),

    currencySymbol: function(){
        switch( this.get( 'currency_id' ) ){
            case 'USD':
                return '<i class="akx-icon akx-usd icon-usd-size margin-right-10"></i>';
            case 'EUR':
                return '<i class="akx-icon akx-euro icon-medium margin-right-10"></i>';
            case 'GBP':
                return '<i class="akx-icon akx-gbp icon-medium margin-right-10"></i>';
            case 'BTC':
                return '&#579;';
            default:
                return '';
        }
    }.property( 'currency_id' ),

    balance_total: function(){
        return Number( this.get( 'balance' ) ) + Number( this.get( 'balance_hold' ) ) + Number( this.get( 'points_out_cash' ) ) + Number( this.get( 'pending_out' ) );
    }.property( 'balance', 'points_out_cash', 'pending_out' )
} );