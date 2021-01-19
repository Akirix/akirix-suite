import DS from 'ember-data';
var locale = new Globalize( navigator.language );

export default DS.Model.extend( {
    company_id: DS.attr(),
    investor_id: DS.attr(),
    currency_id: DS.attr(),
    account_id: DS.attr(),

    name: DS.attr(),
    nickname: DS.attr(),
    account_number: DS.attr(),
    sub_account_id: DS.attr(),
    amount: DS.attr( 'number' ),
    rate: DS.attr( 'number' ),
    end_date: DS.attr(),
    notes: DS.attr(),
    status: DS.attr( 'number' ),
    isInvestor: DS.attr(),
    investor_withdrawal_amount: DS.attr(),

    account: DS.belongsTo( 'account', { async: true} ),
    company: DS.belongsTo( 'company', { async: true} ),
    investor: DS.belongsTo( 'investor', { async: true} ),
    currency: DS.belongsTo( 'currency', { async: true} ),
    projects: DS.hasMany( 'projects', { async: true} ),

    principal_interest: function(){
        return Number( this.get( 'amount' ) ) * ( 100 + Number( this.get( 'rate' ) ) ) / 100.00;
    }.property( 'amount', 'rate' ),

    str_amount: function(){
        return locale.format( Number( this.get( 'amount' ) ), 'n2' );
    }.property( 'amount' ),

    str_rate: function(){
        return locale.format( Number( this.get( 'rate' ) ), 'n2' );
    }.property( 'rate' ),

    str_interest: function(){
        return locale.format( Number( this.get( 'amount' ) ) * Number( this.get( 'rate' ) ) / 100.00, 'n2' );
    }.property( 'amount', 'rate' ),

    str_principal_interest: function(){
        return locale.format( this.get( 'principal_interest' ) );
    }.property( 'principal_interest' ),

    str_investor_withdrawal_amount: function(){
        return locale.format( this.get( 'investor_withdrawal_amount' ) );
    }.property( 'investor_withdrawal_amount' ),

    str_end_date: function(){
        return moment( this.get( 'end_date' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'end_date' ),

    isDraft: function(){
        return this.get( 'status' ) === 0;
    }.property( 'status' ),

    isPending: function(){
        return this.get( 'status' ) === 1;
    }.property( 'status' ),

    isOngoing: function(){
        return this.get( 'status' ) === 2;
    }.property( 'status' ),

    isMature: function(){
        return moment().utc() > moment( this.get( 'end_date' ) ).utc();
    }.property( 'end_date' )


} );

