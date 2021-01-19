import Ember from 'ember';

export default Ember.Component.extend( {
    tagName: 'nav',
    classNames: [ 'navbar', 'container-fluid', 'sticky-top' ],
    attributeBindings: ['role'],
    role: 'navigation',
    session: Ember.inject.service(),
    elementId: 'top-nav',
    showPopover: true,

    getStringList: function(){
        this.set( 'stringList', this.get( 'localeFile.top-nav' ) );
    }.on( 'init' ),

    companyName: function(){
        return this.get( 'session.session.authenticated.company.name' );
    }.property( 'session.session.authenticated.company.name' ),

    getUserName: function(){
        return this.get( 'session.session.authenticated.user.name' );
    }.property(),

    accountNumber: function(){
        return this.get( 'session.session.authenticated.company.account_number' );
    }.property(),

    watchUserSettings: function(){
        this.$( '#link-user-options' ).popover( 'hide' );
        if( this.get( 'showPopover' ) ){
            this.$( '#link-user-options' ).popover( 'dispose' );
            this.set( 'showPopover', false );
            Ember.run.later( ()=>{
                this.set( 'showPopover', true );
            }, 500 );
        }
    }.observes( 'settings.dark_mode' ),

    actions: {
        openModal( options ){
            this.sendAction( 'openModal', options );
        },

        logout(){
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