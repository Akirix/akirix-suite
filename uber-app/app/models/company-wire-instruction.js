import Ember from 'ember';
import DS from 'ember-data';

export default DS.Model.extend( {
    company_id: DS.attr(),
    wire_instruction_id: DS.attr(),
    company: DS.belongsTo( 'company', { async: true } ),
    wireInstruction: DS.belongsTo( 'wireInstruction', { async: true } )
} );
