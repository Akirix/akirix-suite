import Ember from 'ember';

export default Ember.Controller.extend( {
    deviceTypes: [
        { label: 'Phone', val: 0 },
        { label: 'Tablet', val: 1 },
        { label: 'Other', val: 2 }
    ],

    actions: {
        cancel(){
            this.get( 'changeset' ).rollback();
            this.get( 'model' ).destroyRecord().then( ()=>{
                this.send( 'closeSidePanel' );
            } );
        },
        saveAuth(){
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
        }
    }
} );