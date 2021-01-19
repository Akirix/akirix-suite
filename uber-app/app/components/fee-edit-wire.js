import Ember from "ember";

export default Ember.Component.extend( {

    someArr: [ 'book_transfer', 'loan' ],

    keyArray: function(){
        function walk( arr, feeObj ){
            for( var prop in feeObj ){

                if( typeof feeObj[ prop ] === 'object' ){
                    arr.push( Ember.Object.create( { name: prop, value: walk( Ember.A(), feeObj[ prop ] ), type: 'tiered', isTiered: true } ) );
                }
                else{
                    arr.push( Ember.Object.create( { name: prop, value: feeObj[ prop ], type: 'set value', isEditing: false, isTiered: false } ) );
                }
            }
            return arr;
        }

        if( this.get( 'someArr' ).indexOf( this.get( 'feeData.key' ) ) !== -1 ){
            var tmp = {};
            tmp[ this.get( 'feeData.key' ) ] = this.get( 'feeData.value' );
            return walk( Ember.A(), tmp );
        }
        else{
            return walk( Ember.A(), this.get( 'feeData.value' ) );
        }
    }.property( 'feeData' ),

    isWire: function(){
        return this.get( 'selectedType' ) === 'wire';
    }.property( 'selectedType' ),

    actions: {
        edit: function( item ){
            item.set( 'isEditing', true );
        },

        updateObject: function( feeObj, parentObj ){
            // Wire
            if( parentObj ){
                this.get( 'feeData.value' )[ parentObj ][ feeObj.name ] = feeObj.value;
                this.get( 'feeTable' )[ this.get( 'selectedType' ) ][ this.get( 'feeData.key' ) ] = this.get( 'feeData.value' );
            }
            // Fx or someArr depending on feeData.value was previously an object.
            else if( typeof this.get( 'feeData.value' ) === 'object' ){
                if( this.get( 'someArr' ).indexOf( feeObj.name ) !== -1 && typeof feeObj.value !== 'object' ){
                    this.get( 'feeTable' )[ this.get( 'feeData.key' ) ] = feeObj.value;
                }
                else{
                    this.get( 'feeTable' )[ this.get( 'feeData.key' ) ][ feeObj.name ] = feeObj.value;
                }
            }
            // Everything else
            else{
                this.set( 'feeData.value', feeObj.value );
                this.get( 'feeTable' )[ feeObj.name ] = this.get( 'feeData.value' );
            }
            this.sendAction( 'action', this.get( 'feeTable' ) );
        }
    }
} );