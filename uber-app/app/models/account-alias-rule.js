import DS from 'ember-data';

export default DS.Model.extend( {
    created_at: DS.attr(),
    updated_at: DS.attr(),
    prefix: DS.attr(),
    total_length: DS.attr(),
    company_id: DS.attr(),
    range_min: DS.attr(),
    range_max: DS.attr(),
    wire_instruction_id: DS.attr(),
    type: DS.attr(),
    company: DS.belongsTo( 'company', { async: true } ),

    str_name: function(){
        return  this.get( 'prefix' ) + ' [ Range: ' + this.get( 'range_min' ) + ' - ' + this.get('range_max') + ' ]'  ;
    }.property( 'prefix', 'total_length' )
} );