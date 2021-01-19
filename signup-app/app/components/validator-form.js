import Ember from 'ember';

export default Ember.Component.extend( {
    attributeBindings: [ 'id', 'accept', 'autocomplete' ],
    tagName: 'form',
    spinner: '<i class="fa fa-spinner fa-spin"></i>',
    layoutName: 'validator-form',
    originalButtonHtml: null,
    originalButtonWidth: null,

    lockForm: function(){
        var originalButtonHtml = this.get( 'originalButtonHtml' );
        var originalButtonWidth = this.get( 'originalButtonWidth' );

        if( Ember.isEmpty( originalButtonHtml ) ){
            originalButtonHtml = this.$( '[type=submit]' ).html();
            originalButtonWidth = this.$( '[type=submit]' ).width();
            this.set( 'originalButtonHtml', originalButtonHtml );
            this.set( 'originalButtonWidth', originalButtonWidth );
        }

        var isLocked = this.get( 'locked' );
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
    }.observes( 'locked' ).on( 'didInsertElement' ),

    submit: function( e ){
        e.preventDefault();
        this.sendAction( 'action' );
    },

    didInsertElement: function(){
        var _this = this;
        var element = this.$();
        element.attr( 'novalidate', true );

        // Behavior
        element.on( 'submit', function( event ){
            event.preventDefault();
            _this.sendAction( 'action' );
        } );

        this.set( 'originalButtonHtml', this.$( '[type=submit]' ).html() );
        this.set( 'originalButtonWidth', this.$( '[type=submit]' ).width() );
    }
} );

