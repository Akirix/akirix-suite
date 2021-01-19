import Ember from 'ember';

export default Ember.Component.extend( {
    store: Ember.inject.service(),

    getStringList: function(){
        this.set( 'stringList', this.get( 'localeFile.find-bank' ) );
    }.on( 'init' ),

    bankIdObs: function(){
        if( this.get( 'bankId' ) && this.get( 'bankId' ).length > 5 ){
            this.get( 'store' ).query( 'bank', { id: this.get( 'bankId' ) } ).then( ( banks )=>{
                if( Ember.isEmpty( banks ) ){
                    this.setProperties( {
                        errors: [ this.get( 'stringList.bankNotFound' ) ],
                        banks: []
                    } );
                }
                else{
                    this.set( 'errors', [] );
                }

                if( banks.content.length === 1 ){
                    this.set( 'bank', banks.objectAt( 0 ) );
                }
                else{
                    this.setProperties( {
                        banks: banks,
                        hasMore: banks.content.length >= 3
                    } );
                }
            } );
        }
        else if( !this.get( 'bankId' ) ){
            this.setProperties( {
                errors: [],
                bank: null,
                banks: []
            } );
        }
    }.observes( 'bankId' ),

    changesetObs: function(){
        if( !this.get( 'changeset.bank_name' ) ){
            this.setProperties( {
                errors: [ 'Bank Routing Transit Number cannot be blank' ],
                bank: null,
                banks: []
            } );
        }
    }.observes( 'changeset.isValid' ),

    actions: {
        clear(){
            this.set( 'bank', null );
        },

        selectBank( bank ){
            if( bank.get( 'type' ) === 'ABA' ){
                this.set( 'changeset.code_aba', bank.id );
            }
            else{
                this.set( 'changeset.code_swift', bank.id );
            }

            if( this.get( 'changeset.method' ) === 1 && ( !bank.get( 'city' ) || !bank.get( 'state_code' ) || !bank.get( 'zip_code' ) ) ){
                this.get( 'changeset' ).pushErrors( 'method', 'Cannot use this bank with ACH transfer please use a bank with ABA number' );
            }
            
            this.setProperties( {
                bank: bank,
                errors: [],
                'changeset.bank_name': bank.get( 'name' ),
                'changeset.bank_address': bank.get( 'address' ),
                'changeset.bank_city': bank.get( 'city' ),
                'changeset.bank_state_province': bank.get( 'state_code' ),
                'changeset.bank_postal_code': bank.get( 'zip_code' ),
                'changeset.bank_country': bank.get( 'country' ),
                'changeset.bank_phone': bank.get( 'telephone' )
            } );
        },

        redraw(){
            this.get( 'action' )();
        }
    }
} );