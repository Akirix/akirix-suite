import EmberRadioButton from 'ember-radio-buttons';

export default EmberRadioButton.reopen( {
    valueWatcher: function(){
        var label = this.$().parents( 'label' );
        if( label.length > 0 ){
            if( this.get( 'checked' ) === this.get( 'value' ) ){
                label.addClass( 'checked' );
            }
            else{
                label.removeClass( 'checked' );
            }
        }
    }.observes( 'checked' ).on( 'didInsertElement' )
} );