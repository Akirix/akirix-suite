import Ember from "ember";

export default Ember.Component.extend( {
    tagName: 'form',
    layoutName: 'akx-form',
    spinner: '<i class="fa fa-spinner fa-spin"></i>',
    originalButtonHtml: null,
    originalButtonWidth: null,
    isLocked: false,

    lockForm: function(){
        var originalButtonHtml = this.get( 'originalButtonHtml' );
        var originalButtonWidth = this.get( 'originalButtonWidth' );

        if( Ember.isEmpty( originalButtonHtml ) ){
            originalButtonHtml = this.$( '[type=submit]' ).html();
            originalButtonWidth = this.$( '[type=submit]' ).width();
            this.set( 'originalButtonHtml', originalButtonHtml );
            this.set( 'originalButtonWidth', originalButtonWidth );
        }

        var isLocked = this.get( 'isLocked' );
        var submitButton = this.$().find( '[type=submit]' );
        if( isLocked ){
            submitButton.attr( 'disabled', 'disabled' );
            submitButton.width( originalButtonWidth );
            submitButton.html( this.get( 'spinner' ) );
        }
        else{
            submitButton.removeAttr( 'disabled', 'disabled' );
            submitButton.removeClass( 'loading' );
            submitButton.html( originalButtonHtml );
        }
    }.observes( 'isLocked' ),

    submit: function( e ){
        e.preventDefault();
        this.sendAction( 'action' );
    },

    didInsertElement: function(){
        this.set( 'originalButtonHtml', this.$( '[type=submit]' ).html() );
        this.set( 'originalButtonWidth', this.$( '[type=submit]' ).width() );
    }
} );
