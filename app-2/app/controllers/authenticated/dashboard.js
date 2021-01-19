import Ember from 'ember';
import Changeset from 'ember-changeset';
import lookupValidator from 'ember-changeset-validations';
import inviteValidations from 'akx-app/validations/send-invite';

export default Ember.Controller.extend( {
    notify: Ember.inject.service(),
    session: Ember.inject.service(),

    createChangeset: function(){
        this.newChangeset();
    }.on( 'init' ),

    newChangeset(){
        let changeset = new Changeset(
            { name: null, company_name: null, email: null },
            lookupValidator( inviteValidations ),
            inviteValidations,
            { skipValidate: true }
        );
        this.set( 'changeset', changeset );
    },

    validate(){
        return this.get( 'changeset' ).validate().then( ()=>{
            return this.get( 'changeset.isValid' );
        } );
    },

    actions: {
        preview(){
            this.set( 'success', false );
            this.validate().then( ( res )=>{
                this.set( 'isLocked', false );
                res ? this.send( 'openSidePanel', 'dashboard/send-email', '', this ) : '';
            } );
        },
        sendInvite(){
            let changeset = this.get( 'changeset' );
            this.validate().then( ( isValid )=>{
                if( isValid ){
                    return changeset.save();
                }
                return isValid;
            } ).then( ( isValid )=>{
                if( isValid ){
                    return this.get( 'akxUtil' ).authAjax( {
                        type: 'POST',
                        data: JSON.stringify( { data: changeset.get( '_content' ) } )
                    }, '/utilities/sendInvite' );
                }
                return isValid;
            } ).then( ( isValid )=>{
                this.set( 'isLocked', false );
                if( isValid ){
                    changeset.destroy();
                    this.newChangeset();
                    this.set( 'success', true );
                }
            } ).catch( ( err )=>{
                this.set( 'isLocked', false );
                this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
            } );
        }
    }
} );
