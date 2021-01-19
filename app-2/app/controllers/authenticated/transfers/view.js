import Ember from 'ember';

export default Ember.Controller.extend( {
    session: Ember.inject.service( 'session' ),

    actions: {
        cancelWire(){
            let wire = this.get( 'model.wire' );
            this.get( 'akxUtil' ).authAjax( {
                type: 'post'
            }, `/wires/${wire.id}/cancel` ).then( ()=>{
                this.send( 'closeSidePanel' );
            } ).catch( ( err )=>{
                this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
            } );
        }
    }
} );