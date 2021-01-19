import Ember from 'ember';
import config from 'akx-app/config/environment';

export default Ember.Controller.extend( {
    notify: Ember.inject.service(),
    actions: {
        forgot(){
            let changeset = this.get( 'changeset' );
            let instructions1 = this.get( 'stringList.instructions1' );
            let instructions2 = this.get( 'stringList.instructions2' );
            changeset.validate().then( ()=>{
                if( changeset.get( 'isValid' ) ){
                    Ember.$.ajax( {
                        url: `${config.APP.api_host}/users/forgot`,
                        cache: false,
                        dataType: 'json',
                        type: 'POST',
                        data: { email: changeset.get( 'email' ) }
                    } ).then( ()=>{
                        this.set( 'isLocked', false );
                        this.get( 'notify' ).success( `${instructions1} ${changeset.get( 'email' )} ${instructions2}`, {
                            classNames: [ 'bg-success' ]
                        } );
                        this.transitionToRoute( 'login' );
                    } ).catch( ( error )=>{
                        this.set( 'isLocked', false );
                        if( error.status === 400 ){
                            // Check onboarding
                            Ember.$.ajax( {
                                url: `${config.APP.signup_api_host}/password-recoveries`,
                                cache: false,
                                dataType: 'json',
                                type: 'POST',
                                data: { email: changeset.get( 'email' ) }
                            } ).then( ()=>{
                                this.get( 'notify' ).success( `${instructions1} ${changeset.get( 'email' )} ${instructions2}`, {
                                    classNames: [ 'bg-success' ]
                                } );
                                this.transitionToRoute( 'login' );
                            } ).catch( ( onboardingError )=>{
                                this.send( 'error', { errors: [ {
                                    errors: 'User not found',
                                    status: onboardingError.status
                                } ] } );
                            } );
                        }
                        else{
                            this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( error ) );
                        }
                    } );
                }
                else{
                    this.set( 'isLocked', false );
                }
            } );
        }
    }
} );
