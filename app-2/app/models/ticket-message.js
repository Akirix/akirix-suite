import DS from 'ember-data';

export default DS.Model.extend( {
    user_id: DS.attr(),
    ticket_id: DS.attr(),

    created_at: DS.attr(),
    updated_at: DS.attr(),
    notes: DS.attr(),

    user: DS.belongsTo( 'user', { async: true } ),
    ticket: DS.belongsTo( 'ticket', { async: true } )
} );