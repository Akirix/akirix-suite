import Ember from 'ember';
import projectAnimation from 'akx-app/mixins/project-animation';

export default Ember.Controller.extend( projectAnimation, {

    actions: {
        returnFunds(){
            let changeset = this.get( 'changeset' );
            let node = this.get( 'model.node' );
            changeset.validate().then( ()=>{
                if( changeset.get( 'isValid' ) ){
                    return this.get( 'akxUtil' ).authAjax( {
                        type: 'POST',
                        data: JSON.stringify( { data: { amount: changeset.get( 'amount' ) } } )
                    }, `/nodes/${node.get( 'id' )}/return_funds` );
                }
                return changeset.get( 'isValid' );
            } ).then( ( isValid )=>{
                this.set( 'isLocked', false );
                if( isValid ){
                    node.get( 'content' ).reload();
                    this.set( 'success', true );
                }
            } ).catch( ( err )=>{
                this.set( 'isLocked', false );
                this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
            } );
        }
    }
} );
