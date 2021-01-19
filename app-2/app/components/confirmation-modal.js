import Ember from 'ember';

export default Ember.Component.extend( {
    tagName:'button',
    attributeBindings: [ 'data-toggle', 'data-target', 'name' ],

    didInsertElement(){
        this.$().html( this.get( 'html' ) );
    },

    click(){
        let applicationController = Ember.getOwner( this ).lookup( 'controller:application' );
        applicationController.set( 'options', {
            headerTitle: this.get( 'headerTitle' ),
            prompt: this.get( 'prompt' ),
            action: this.get( 'action' ),
            context: this.get( 'context' ),
            controller: this.get( 'controller' )
        } );
    }
} );
