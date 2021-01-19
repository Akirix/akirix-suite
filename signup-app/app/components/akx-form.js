import Ember from 'ember';

export default Ember.Component.extend( {
    tagName: 'form',
    spinner: '<i class="fa fa-spinner fa-spin"></i>',

    didInsertElement(){
        let submitButton = this.$().find( '[type=submit]' );
        this.set( 'originalButtonHtml', submitButton.html() );
        this.set( 'originalButtonWidth', submitButton.width() );
        this.set( 'originalButtonHeight', submitButton.height() );
    },

    lockForm: function(){
        if( !this.get( 'isLocked' ) && this.get( 'originalButtonHtml' ) !== null ){
            this.$().find( '[type=submit]' ).html( this.get( 'originalButtonHtml' ) );
        }
    }.observes( 'isLocked' ),

    submit: function( e ){
        e.preventDefault();
        if( !this.get( 'isLocked' ) ){
            this.set( 'isLocked', true );
            let submitButton = this.$().find( '[type=submit]' );
            submitButton.html( this.get( 'spinner' ) );
            submitButton.width( this.get( 'originalButtonWidth' ) );
            submitButton.height( this.get( 'originalButtonHeight' ) );
            this.sendAction();
        }
    }
} );