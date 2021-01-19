import Ember from 'ember';

export default Ember.Component.extend( {
    classNames: [ 'auth-pane' ],
    hasKey: false,
    hasApp: false,
    isLocked: false,
    errors: [],
    store: Ember.inject.service(),
    notify: Ember.inject.service(),

    setAuthenticator: function(){
        this.get( 'store' ).findAll( 'authenticator' ).then( ( authenticators )=>{
            this.setProperties( {
                stringList: this.get( 'localeFile.authenticate-pane' ),
                authenticators: authenticators
            } );
            authenticators.forEach( ( authenticator )=>{
                if( authenticator.get( 'status' ) === 1 ){
                    switch( authenticator.get( 'type' ) ){
                        case 0:
                        case 1:
                        case 2:
                            this.set( 'hasApp', true );
                            break;
                        case 3:
                            this.set( 'hasKey', true );
                            break;
                    }
                }
            } );
        } );
    }.on( 'init' ),

    keyUp( e ){
        let code = `${this.get( 'codePart1' )}${this.get( 'codePart2' )}`;
        if( this.get( 'codePart1' ).length === 3 ){
            if( e.keyCode === 8 && this.get( 'codePart2' ).length === 0 ){
                Ember.$( '.input1' ).focus();
            }
            else{
                Ember.$( '.input2' ).focus();
            }
        }
        if( !Ember.isEmpty( code ) && !Ember.isEmpty( this.get( 'errors' ) ) ){
            this.set( 'errors', [] );
        }
    },

    actions: {
        twoFactorSms(){
            this.get( 'akxUtil' ).authAjax( {
                type: 'POST'
            }, '/authenticators/sms' ).then( ( response )=>{
                this.get( 'notify' ).success( response.message, {
                    classNames: [ 'bg-success' ]
                } );
                this.$( '.input1' ).focus();
            } ).catch( ( err )=>{
                this.sendAction( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
            } );
        },
        authenticate(){
            let code = `${this.get( 'codePart1' )}${this.get( 'codePart2' )}`;
            if( !Ember.isEmpty( code ) ){
                this.get( 'akxUtil' ).authAjax( {
                    type: 'POST',
                    data: JSON.stringify( { data: { code: code } } )
                }, '/authenticators/auth' ).then( ()=>{
                    this.set( 'isLocked', false );
                    this.set( 'codePart1', '' );
                    this.set( 'codePart2', '' );
                    this.sendAction( 'action' );
                } ).catch( ()=>{
                    this.set( 'isLocked', false );
                    this.set( 'errors', [ 'Code is incorrect' ] );
                } );
            }
            else{
                this.set( 'isLocked', false );
                this.set( 'errors', [ 'Code cannot be blank' ] );
            }
        },

        cancelTwoFactorPane(){
            this.set( 'codePart2', null );
            this.set( 'codePart1', null );
            this.sendAction( 'action', true );
        }
    }
} );