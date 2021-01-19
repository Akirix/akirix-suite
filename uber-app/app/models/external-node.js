import Ember from 'ember';
import DS from 'ember-data';

export default DS.Model.extend( {
    node_id: DS.attr(),
    project_id: DS.attr(),
    name: DS.attr(),
    point_of_contact: DS.attr(),
    phone: DS.attr(),
    email: DS.attr(),
    status: DS.attr( 'number' ),

    node: DS.belongsTo( 'node', { async: true } ),
    project: DS.belongsTo( 'project', { async: true } )

} );