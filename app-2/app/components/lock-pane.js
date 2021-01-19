import Ember from 'ember';

export default Ember.Component.extend( {
    classNames: [ 'overpane-content', 'margin-top-30' ],
    session: Ember.inject.service(),
    
    getStringList: function(){
        this.set( 'stringList', this.get( 'localeFile.lock-pane' ) );
    }.on( 'init' ),

    actions: {
        close(){
            let token = this.get( 'session.session.authenticated.access_token' );
            this.get( 'akxUtil' ).authAjax( {
                type: 'POST',
                data: JSON.stringify( { token: token } )
            }, '/tokens/revoke' ).then( () =>{
                this.get( 'session' ).invalidate();
            } ).catch( ( err ) =>{
                this.get( 'session' ).invalidate();
                this.sendAction( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
            } );
        }
    }
} );
