import Ember from 'ember';

export default Ember.Component.extend( {
    store: Ember.inject.service(),
    classNames: [ 'invoice-items-list' ],
    getStringList: function(){
        this.set( 'stringList', this.get( 'localeFile.node-items-list' ) );

        if( Ember.isEmpty( this.get( 'items' ) ) ){
            this.send( 'addNodeItem' );
        }
    }.on( 'init' ),

    nodeItemsCheck: function(){
        if( this.get( 'edit' ) ){
            let stringList = this.get( 'stringList' );
            this.get( 'items' ).forEach( ( item )=>{
                if( Ember.isEmpty( item.get( 'name' ) ) ){
                    Ember.set( item, 'errors.name', [ stringList.nameError ] );
                }
                else{
                    Ember.set( item, 'errors.name', [] );
                }
            } );
        }
    }.observes( 'items.@each.name' ),

    actions: {
        addNodeItem: function(){
            let newItem = this.get( 'store' ).createRecord( 'node-item', {
                name: null,
                price: 0.00,
                project_id: this.get( 'project.id' ),
                node_id: this.get( 'project.node.id' )
            } );
            this.get( 'items' ).pushObject( newItem );
        },
        deleteNodeItem: function( item ){
            if( item.deleteRecord ){
                item.deleteRecord();
            }
            this.get( 'items' ).removeObject( item );
        }
    }
} );