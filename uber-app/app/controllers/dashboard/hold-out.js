import Ember from 'ember';

export default Ember.Controller.extend( {
    paneSecondary: null,
    sortProperties: [ 'created_at:desc' ],
    sortedWires: Ember.computed.sort( 'wires', 'sortProperties' ),
    actions: {}
} );
