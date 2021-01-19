import Ember from 'ember';

export default Ember.Controller.extend( {

    actions: {
        savePassword(){
            let changeset = this.get( 'changeset' );
            changeset.validate().then( ()=>{
                if( changeset.get( 'isValid' ) ){
                    return changeset.save();
                }
            } ).then( ()=>{
                this.set( 'isLocked', false );
                if( changeset.get( 'isValid' ) ){
                    this.set( 'success', true );
                }
            } ).catch( ( err )=>{
                this.set( 'isLocked', false );
                this.send( 'error', err );
            } );
        },
        cancel(){
            this.get( 'changeset' ).rollback();
            this.transitionToRoute( 'authenticated.dashboard' );
        }
    }
} );
