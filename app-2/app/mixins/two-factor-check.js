import Ember from 'ember';

export default Ember.Mixin.create( {
    afterModel(){
        return this.get( 'akxUtil' ).isTwoFactorAuthenticated().then( ( response ) =>{
            if( !response.isTwoFactorAuthenticated ){
                this.send( 'showOverlay', 'authenticate-pane', { action: 'closePane' } );
            }
            else {
                this._super( ...arguments );
            }
        } ).catch( ( err )=>{
            this.send( 'error', this.get( 'akxUtil' ).formatAjaxError( err ) );
        } )
    }
} );