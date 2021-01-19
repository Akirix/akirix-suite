import Ember from 'ember';

export default Ember.Component.extend( {

    init: function(){
        this._super();
        // this.set( 'sNodes', null );
        this.getSnodes();
    },

    rerender: function(){
        this.getSnodes();
    }.observes( 'theNode.id' ),

    getSnodes: function(){
        this.set( 'sNodes', this.store.find( 'node', { parent_id: this.get( 'theNode.id' ) } ) );
    },

    getNodeItems: function(){
        if( Ember.isEmpty( this.get( 'sNodes' ) ) ){
            this.set( 'nodeItems', this.store.find( 'node-item', { node_id: this.get( 'theNode.id' ) } ) );
        }
    }.observes( 'sNodes.length' )
} );
