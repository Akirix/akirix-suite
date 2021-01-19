import Ember from "ember";

export default Ember.Component.extend( {
    tagName: 'tr',
    classNames: [ 'list-link' ],
    types: [ { name: 'set value' }, { name: 'tiered' } ],
    hasErrors: false,
    zeroName: false,
    table: {},

    feeType: function(){

        if( this.get( 'fee.type' ) === 'tiered' ){

            if( this.get( 'fee.oldValue' ) ){
                this.set( 'fee.value', this.get( 'fee.oldValue' ) );
            }
            else if( typeof this.get( 'fee.value' ) !== 'object' ){
                this.get( 'fee' )[ 'oldValue' ] = this.get( 'fee.value' );
                this.set( 'fee.value', [ Ember.Object.create( { name: null, value: null, type: 'set value' } ) ] );
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

        validate: function( obj ){

            if( Ember.isEmpty( obj ) ){
                obj.set( 'errors.name', [ 'Cannot be blank' ] );
            }
        },

        add: function( fee ){
            fee.get( 'value' ).pushObject( Ember.Object.create( { name: null, value: null, type: 'set value' } ) );
        },

        deleteTier: function( parentObj, fee ){
            parentObj.get( 'value' ).removeObject( fee );
        },

        save: function(){
            var self = this;
            var tempObj = { name: this.get( 'fee.name' ), value: {} };
            self.set( 'table.errors', Ember.A() );
            self.set( 'hasErrors', false );
            if( self.get( 'fee.value' ).length > 1 ){
                self.get( 'fee.value' ).forEach( function( obj ){
                    obj.set( 'errors', { name: null, value: null } );

                    if( Ember.isEmpty( obj.get( 'name' ) ) ){
                        self.set( 'hasErrors', true );
                        obj.set( 'errors.name', [ 'Cannot be blank' ] );
                    }

                    if( Ember.isEmpty( obj.get( 'value' ) ) ){
                        self.set( 'hasErrors', true );
                        obj.set( 'errors.value', [ 'Cannot be blank' ] );
                    }

                    if( isNaN( Number( obj.get( 'name' ) ) ) ){
                        tempObj.value[ obj.get( 'name' ) ] = Number( obj.get( 'value' ) );
                    }
                    else{
                        tempObj.value[ Number( obj.get( 'name' ) ) ] = Number( obj.get( 'value' ) );
                    }

                    if( Number( obj.get( 'name' ) ) === 0 ){
                        self.set( 'zeroName', true );
                    }
                } );
                if( !self.get( 'hasErrors' ) && self.get( 'zeroName' ) ){
                    self.set( 'fee.isEditing', false );
                    self.sendAction( 'action', tempObj, self.get( 'parentObj' ) );
                }
                else{
                    self.get( 'fee.value' ).objectAt( 0 ).errors.name = [ 'At least one name must be 0' ];
                }
            }
            else{
                self.set( 'table.errors', [ 'Must have at least two rows' ] )
            }
        }
    }
} );