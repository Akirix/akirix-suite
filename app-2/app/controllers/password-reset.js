import Ember from 'ember';
import config from 'akx-app/config/environment';

export default Ember.Controller.extend( {
    notify: Ember.inject.service(),
    queryParams: ['token', 'email'],

    actions: {
        reset(){
            const changeset = this.get( 'changeset' );
            changeset.validate().then( ()=>{
                let token = this.get( 'token' );
                let email = this.get( 'email' );

                if( changeset.get( 'isValid' ) ){
                    return Ember.$.ajax( {
                        url: `${config.APP.api_host}/users/password_reset?token=${token}&email=${email}`,
                        cache: false,
                        dataType: 'json',
                        type: 'POST',
                        data: { password: changeset.get( 'password' ) }
                    } )
                }
                return changeset.get( 'isValid' );
            } ).then( ( isValid )=>{
                this.set( 'isLocked', false );
                if( isValid ){
                    this.get( 'notify' ).success( this.get( 'stringList.successNotify' ), {
                        classNames: [ 'bg-success' ]
                    } );
                    this.transitionToRoute( 'login' );
                }
            } ).catch( ( err )=>{
                this.set( 'isLocked', false );
                this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
            } );
        }
    }
} );
