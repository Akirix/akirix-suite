import Ember from 'ember';

export default Ember.Component.extend( {
    classNames: [ 'togglebutton' ],

    willDestroy() {
        this._super();
        Ember.run.cancel( this.get( 'debounceFilter' ) );
    },

    click(){
        this.set( 'debounceFilter', Ember.run.debounce( this, this.update, 500, false ) );
    },

    update(){
        let settings = this.get( 'settings' );
        if( settings.get('dark_mode') ){
            settings.set( 'dark_mode', false );
        }
        else{
            settings.set( 'dark_mode', true );
        }
        settings.save().then( ()=>{
            if ( settings.get( 'dark_mode' ) ) {
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
        } ).catch( ( err )=>{
            this.sendAction( 'error', err );
        } );
    }
} );