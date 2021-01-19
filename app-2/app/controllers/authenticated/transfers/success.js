import Ember from 'ember';

export default Ember.Controller.extend( {
    notify: Ember.inject.service(),
    changes: function(){
        let changeset = this.get( 'changeset' );
        let wire = this.get( 'model.wire' );
        let template = this.get( 'model.template' );

        changeset.setProperties( {
            method: wire.get( 'method' ),
            beneficiary_type: wire.get( 'beneficiary_type' ),
            purpose: wire.get( 'purpose' ),
            notes: wire.get( 'notes' ),
            bank_name: wire.get( 'bank_name' ),
            bank_address: wire.get( 'bank_address' ),
            bank_city: wire.get( 'bank_city' ),
            bank_state_province: wire.get( 'bank_state_province' ),
            bank_postal_code: wire.get( 'bank_postal_code' ),
            bank_country: wire.get( 'bank_country' ),
            code_swift: wire.get( 'code_swift' ),
            code_aba: wire.get( 'code_aba' ),
            code_irc: wire.get( 'code_irc' ),
            account_holder: wire.get( 'account_holder' ),
            account_number: wire.get( 'account_number' ),
            account_iban: wire.get( 'account_iban' ),
            account_holder_dob: wire.get( 'account_holder_dob' ),
            account_holder_address: wire.get( 'account_holder_address' ),
            account_holder_city: wire.get( 'account_holder_city' ),
            account_holder_state_province: wire.get( 'account_holder_state_province' ),
            account_holder_postal_code: wire.get( 'account_holder_postal_code' ),
            account_holder_country: wire.get( 'account_holder_country' ),
            account_holder_nationality: wire.get( 'account_holder_nationality' ),
            intermediary_bank_code_aba: wire.get( 'intermediary_bank_code_aba' ),
            intermediary_bank_code_swift: wire.get( 'intermediary_bank_code_swift' ),
            intermediary_bank_name: wire.get( 'intermediary_bank_name' ),
            intermediary_bank_address: wire.get( 'intermediary_bank_address' ),
            intermediary_bank_city: wire.get( 'intermediary_bank_city' ),
            intermediary_bank_state_province: wire.get( 'intermediary_bank_state_province' ),
            intermediary_bank_postal_code: wire.get( 'intermediary_bank_postal_code' ),
            intermediary_bank_country: wire.get( 'intermediary_bank_country' )
        } );

        let diffs = changeset.get( 'changes' ).filter( ( obj )=>{
            return obj.value !== template.get( obj.key );
        } );
        return !Ember.isEmpty( diffs );
    }.property( 'model.template' ),

    actions: {
        backToTransfers(){
            Ember.getOwner( this ).lookup( 'route:authenticated.transfers' ).refresh();
            this.transitionToRoute( 'authenticated.transfers' );
        },
        saveChanges(){
            this.get( 'changeset' ).save().then( ()=>{
                this.get( 'notify' ).success( this.get( 'stringList.templateSaved' ), {
                    classNames: [ 'bg-success' ]
                } );
            } ).catch( ( err )=>{
                this.send( 'error', err );
            } );
        },
        saveAsTemplate(){
            let wire = this.get( 'model.wire' );
            this.store.createRecord( 'wire-template', {
                method: wire.get( 'method' ),
                beneficiary_type: wire.get( 'beneficiary_type' ),
                purpose: wire.get( 'purpose' ),
                notes: wire.get( 'notes' ),
                bank_name: wire.get( 'bank_name' ),
                bank_address: wire.get( 'bank_address' ),
                bank_city: wire.get( 'bank_city' ),
                bank_state_province: wire.get( 'bank_state_province' ),
                bank_postal_code: wire.get( 'bank_postal_code' ),
                bank_country: wire.get( 'bank_country' ),
                code_swift: wire.get( 'code_swift' ),
                code_aba: wire.get( 'code_aba' ),
                code_irc: wire.get( 'code_irc' ),
                account_holder: wire.get( 'account_holder' ),
                account_number: wire.get( 'account_number' ),
                account_iban: wire.get( 'account_iban' ),
                account_holder_dob: wire.get( 'account_holder_dob' ),
                account_holder_address: wire.get( 'account_holder_address' ),
                account_holder_city: wire.get( 'account_holder_city' ),
                account_holder_state_province: wire.get( 'account_holder_state_province' ),
                account_holder_postal_code: wire.get( 'account_holder_postal_code' ),
                account_holder_country: wire.get( 'account_holder_country' ),
                account_holder_nationality: wire.get( 'account_holder_nationality' ),
                intermediary_bank_code_aba: wire.get( 'intermediary_bank_code_aba' ),
                intermediary_bank_code_swift: wire.get( 'intermediary_bank_code_swift' ),
                intermediary_bank_name: wire.get( 'intermediary_bank_name' ),
                intermediary_bank_address: wire.get( 'intermediary_bank_address' ),
                intermediary_bank_city: wire.get( 'intermediary_bank_city' ),
                intermediary_bank_state_province: wire.get( 'intermediary_bank_state_province' ),
                intermediary_bank_postal_code: wire.get( 'intermediary_bank_postal_code' ),
                intermediary_bank_country: wire.get( 'intermediary_bank_country' )
            } ).save().then( ()=>{
                this.get( 'notify' ).success( this.get( 'stringList.templateCreated' ), {
                    classNames: [ 'bg-success' ]
                } );
            } ).catch( ( err )=>{
                this.send( 'error', err );
            } );
        }
    }
} );
