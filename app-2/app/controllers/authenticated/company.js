import Ember from 'ember';

export default Ember.Controller.extend( {

    companyIsUS: function(){
        return this.get( 'changeset.country' ) === 'US';
    }.property( 'changeset.country' ),

    actions: {
        save(){
            let changeset = this.get( 'changeset' );

            changeset.validate().then( ()=>{       
                if( changeset.get( 'isValid' ) ){
                    return changeset.save();
                }
            } ).then( ()=>{
                if( changeset.get( 'isValid' ) ){
                    this.set( 'isLocked', false );
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

