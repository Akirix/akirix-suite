import Ember from 'ember';
import StringObjectMixin from 'akx-app/mixins/route-locale';

export default Ember.Route.extend( StringObjectMixin, {
    activate(){
        Ember.run.schedule( 'afterRender', () => {
            Ember.$( '#main-pane' ).on( 'mouseenter', () => {
                Ember.$( '.popover' ).popover( 'hide' );
            } );
        } );
    },

    model(){
        return Ember.RSVP.hash( {
            announcements: this.store.findAll( 'announcement' ),
            accounts: this.store.findAll( 'account' ),
            userSettings: this.store.findAll( 'user-setting' )
        } );
    },
    
    afterModel( model ){
        this._super( ...arguments );
        model[ 'settings' ] = model.userSettings.objectAt( 0 );
        if( model.userSettings.objectAt( 0 ).get( 'dark_mode' ) ){
            Ember.$( "<link/>", {
                rel: "stylesheet",
                type: "text/css",
                href: "/assets/dark.css"
            } ).appendTo( 'head' );
        }
        else{
            Ember.$( "<link/>", {
                rel: "stylesheet",
                type: "text/css",
                href: "/assets/akx-app.css"
            } ).appendTo( 'head' );
        }
    }
} );
