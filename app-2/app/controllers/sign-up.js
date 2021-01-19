import Ember from 'ember';
import config from 'akx-app/config/environment';

export default Ember.Controller.extend( {
    notify: Ember.inject.service(),
    passwordStrength: Ember.inject.service(),

    actions: {
        signUp(){
            let changeset = this.get( 'changeset' );
            changeset.validate().then( ()=>{
                if( changeset.get( 'isValid' ) ){
                    Ember.$.ajax( {
                        url: `${config.APP.signup_api_host}/users`,
                        type: 'POST',
                        dataType: 'json',
                        data: { email: changeset.get( 'email' ), password: changeset.get( 'password' ) }
                    } ).then( ()=>{
                        return Ember.$.ajax( {
                            url: `${config.APP.signup_api_host}/tokens`,
                            type: 'POST',
                            dataType: 'json',
                            data: { email: changeset.get( 'email' ), password: changeset.get( 'password' ) }
                        } ).then( ( res )=>{
                            this.set( 'isLocked', false );
                            window.location = `${config.APP.signup_app_host}/#/login?token=${res.access_token}`;
                        } );
                    } ).catch( ( err )=>{
                        this.set( 'isLocked', false );
                        if( err.status === 409 ){
                            this.get( 'notify' ).alert( `${changeset.get('email')} ${this.get( 'stringList.emailError')}`, {
                                classNames: [ 'bg-warning' ]
                            } );
                        }
                        else{
                            this.send( 'error', {
                                errors: {
                                    status: err.status,
                                    errors: err.responseJSON.errors
                                }
                            } );
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
