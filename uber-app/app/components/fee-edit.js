import Ember from "ember";
import EmberValidations from 'ember-validations';

export default Ember.Component.extend( EmberValidations.Mixin, {

    tagName: 'tr',
    classNames: [ 'list-link' ],
    types: [ { name: 'set value'  }, { name: 'tiered' } ],

    validations: {
        'fee.name': {
            presence: true
        },
        'fee.value': {
            presence: true
        },
        'fee.type': {
            presence: true
        }
    },

    feeType: function(){

        if( this.get( 'fee.type' ) === 'tiered' ){

            if( this.get( 'fee.oldValue' ) ){
                this.set( 'fee.value', this.get( 'fee.oldValue' ) );
            }
            else if( typeof this.get( 'fee.value' ) !== 'object' ){
                this.get( 'fee' )[ 'oldValue' ] = this.get( 'fee.value' );
                this.set( 'fee.value', [ Ember.Object.create( { name: '', value: '', type: 'set value' } ) ] );
            }
            this.set( 'fee.isTiered', true );
        }
        else{

            if( typeof this.get( 'fee.value' ) === 'object' ){
                this.get( 'fee' )[ 'oldValue' ] = this.get( 'fee.value' );
                this.set( 'fee.value', '' );
            }
            this.set( 'fee.isTiered', false );
        }
    }.observes( 'fee.type' ),

    actions: {

        save: function(){
            var self = this;
            this.validate().then( function(){
                var tmpObj = { name: self.get( 'fee.name' ), value: Number( self.get( 'fee.value' ) ) };
                self.set( 'fee.isEditing', false );
                self.sendAction( 'action', tmpObj, self.get( 'parentObj' ) );
            } );
        }
    }
} );