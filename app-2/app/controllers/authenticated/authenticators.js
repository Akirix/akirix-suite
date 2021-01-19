import Ember from 'ember';

export default Ember.Controller.extend( {
    session: Ember.inject.service(),

    canAddAuth: function(){
        let acl = this.get( 'session.data.authenticated.access' );
        return acl[ "POST /authenticators" ];
    }.property(),

    canActivate: function(){
        let acl = this.get( 'session.data.authenticated.access' );
        return acl[ "POST /authenticators/:authenticator_id/activate" ];
    }.property(),

    actions: {
        activateDevicePane( auth ){
            this.send( 'showOverlay', 'activate-authenticator', {
                action: 'closePane',
                authenticator: auth
            } );
        },
        revoke( auth ){
            auth.destroyRecord().catch( ( err )=>{
                this.send( 'error', err );
            } );
        }
    }
} );