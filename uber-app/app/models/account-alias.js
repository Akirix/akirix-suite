import DS from 'ember-data';

export default DS.Model.extend( {
    created_at: DS.attr(),
    updated_at: DS.attr(),
    name: DS.attr(),
    iban: DS.attr(),
    notes: DS.attr(),
    account_id: DS.attr(),
    company_id: DS.attr(),
    model: DS.attr(),
    model_id: DS.attr(),
    client_account_id: DS.attr(),
    client_company_id: DS.attr(),
    wire_instruction_id: DS.attr(),
    status: DS.attr(),
    account: DS.belongsTo( 'account', { async: true } ),
    company: DS.belongsTo( 'company', { async: true } ),
    clientCompany: DS.belongsTo( 'company', { async: true } ),
    clientAccount: DS.belongsTo( 'account', { async: true } ),
    wireInstruction: DS.belongsTo( 'wire-instruction', { async: true } ),

    str_created_at_date: function(){
        return moment( this.get( 'created_at' ) ).utc().format( 'MM/DD/YYYY' );
    }.property( 'created_at' )
} );