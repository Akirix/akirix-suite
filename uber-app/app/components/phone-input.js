import Ember from 'ember';

export default Ember.TextField.extend( {
    placeholder: '+1 555-555-5555',
    type: 'tel',
    formattedValue: null,

    valueWatcher: function(){
        var input = this.$();
        var value = input.intlTelInput( 'getNumber' );

        if( typeof value === 'string' ){
            this.set( 'formattedValue', value );
        }
    }.observes( 'value' ).on( 'didInsertElement' ),

    didInsertElement: function(){
        this._super();
        var input = this.$();
        input.intlTelInput();
    }
} );
