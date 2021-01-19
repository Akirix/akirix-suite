import Ember from 'ember';
import projectAnimation from 'akx-app/mixins/project-animation';

export default Ember.Controller.extend( projectAnimation, {

    actions: {
        acceptInvitation(){
            let changeset = this.get( 'changeset' );
            changeset.validate().then( ()=>{
                if( changeset.get( 'isValid' ) ){
                    return changeset.save();
                }
                return changeset.get( 'isValid' );
            } ).then( ( isValid )=>{
                if( isValid ){
                    return this.get( 'akxUtil' ).authAjax( {
                        type: 'POST',
                        data: JSON.stringify( { node: changeset.get( '_content' ) } )
                    }, `/nodes/${changeset.get( 'id' )}/accept` );
                }
                return isValid;
            } ).then( ( isValid )=>{
                this.set( 'isLocked', false );
                if( isValid ){
                    this.get( 'model.project' ).reload();
                    changeset.get( '_content' ).reload();
                    this.send( 'closeSidePanel' );
                }
            } ).catch( ( err )=>{
                this.set( 'isLocked', false );
                this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
            } );
        },

        declineInvitation(){
            this.get( 'changeset' ).rollback();
            let project = this.get( 'model.project' );
            this.get( 'akxUtil' ).authAjax( {
                type: 'POST'
            }, `/nodes/${project.get( 'node.id' )}/decline` ).then( ()=>{
                project.deleteRecord();
                this.send( 'closeSidePanel', true );
                this.transitionToRoute( 'authenticated.projects' );
            } ).catch( ( err )=>{
                this.set( 'isLocked', false );
                this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
            } );
        }
    }
} );
