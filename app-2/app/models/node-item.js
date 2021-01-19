import DS from 'ember-data';

export default DS.Model.extend( {
    node_id: DS.attr(),
    project_id: DS.attr(),
    name: DS.attr(),
    price: DS.attr( 'number' ),

    node: DS.belongsTo( 'node', { async: true } ),
    project: DS.belongsTo( 'project', { async: true } )
} );

