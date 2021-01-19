import Ember from 'ember';

export default Ember.Controller.extend( {
    actions: {
        save(){
            let changeset = this.get( 'changeset' );

            changeset.set( 'name', changeset.get( 'name' ).trim() );
            changeset.validate().then( ()=>{
                if( changeset.get( 'isValid' ) ){
                    return changeset.save();
                }
                return changeset.get( 'isValid' );
            } ).then( ( isValid )=>{
                if( isValid ){
                    this.get( 'model' ).reload();
                    this.set( 'success', true );
                }
            } ).catch( ( err )=>{
                this.send( 'error', err );
            } );
        }

    }
} );