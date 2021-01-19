import Ember from 'ember';

export default Ember.Component.extend( {
    tagName: 'input',
    type: 'radio',
    classNames: [ 'form-check-input' ],

    attributeBindings: [
        'checked',
        'name',
        'type',
        'groupValue',
        'value'
    ],

    didInsertElement(){
        this.set( 'checked', Ember.isEqual( this.get( 'groupValue' ), this.get( 'value' ) ) );
    },

    click(){
        this.set( 'groupValue', this.get( 'value' ) );
    }
} );