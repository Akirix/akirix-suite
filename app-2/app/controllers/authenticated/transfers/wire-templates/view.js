import Ember from 'ember';

export default Ember.Controller.extend( {
    actions: {
        deleteTemplate(){
            this.get( 'model.wireTemplate' ).destroyRecord().then( ()=>{
                this.transitionToRoute( 'authenticated.transfers.wire-templates' );
            } );
        },
        edit(){
            this.transitionToRoute(
                'authenticated.transfers.wire-templates.edit',
                this.get( 'model.wireTemplate.id' )
            );
            this.send( 'closeSidePanel', true );
        }
    }
} );