import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {

    paneSecondary: 'companies/fees/view-fee',

    feeArray: function(){
        var feeArr = Ember.A();

        for( var key in this.get( 'feeTable' ) ){

            if( typeof this.get( 'feeTable' )[ key ] === 'object' ){
                if( key === 'wire' ){
                    feeArr.push( { key: key, value: 'Multiple values', isWire: true } )
                }
                else{
                    feeArr.push( { placeholder: 'Multiple values', key: key, value: this.get( 'feeTable' )[ key ] } )
                }
            }
            else{
                feeArr.push( { placeholder: this.get( 'feeTable' )[ key ], key: key, value: this.get( 'feeTable' )[ key ] } );
            }
        }
        return feeArr;
    }.property(),

    selectedType: null,

    actions: {
        update: function( feeTable ){
            var self = this;
            this.set( 'fee.fee_data', JSON.stringify( feeTable, null, 4 ) );
            this.get( 'fee' ).save().then(
                function(){
                    self.notify.success( 'Fees updated', { closeAfter: 5000 } );
                },
                function( xhr ){
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                } );
        },

        view: function( fee, type ){
            this.set( 'selectedFee', fee );
            this.set( 'selectedType', type );
        }
    }
} );