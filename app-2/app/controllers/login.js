import Ember from 'ember';

export default Ember.Controller.extend( {
    session: Ember.inject.service(),
    queryParams: [ 'token' ],

    isValidObs: Ember.observer( 'changeset.isValid', function(){
        if( this.get( 'isLocked' ) && this.get( 'changeset.isValid' ) ){
            this.set( 'isLocked', false );
        }
    } ),

    actions: {
        login(){
            if( this.get( 'token' ) ){
                this.get( 'session' ).authenticate( 'authenticator:oauth2', { token: this.get( 'token' ) } ).catch( ( err ) =>{
                    this.set( 'isLocked', false );
                    this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
                } );
            }
            else{
                this.get( 'changeset' ).validate().then( () => {
                    if( this.get( 'changeset.isValid' ) ){
                        let data = {
                            email: this.get( 'changeset.email' ),
                            password: this.get( 'changeset.password' )
                        };
                        return this.get( 'session' ).authenticate( 'authenticator:oauth2', data );
                    }
                } ).then( ()=>{
                    this.set( 'isLocked', false );
                } ).catch( ( err ) =>{
                    this.set( 'isLocked', false );
                    this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
                } );
            }
        }
    }
} );
