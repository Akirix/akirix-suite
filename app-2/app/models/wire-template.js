import DS from 'ember-data';
import StringObjectMixin from 'akx-app/mixins/model-locale';

export default DS.Model.extend( StringObjectMixin, {
    name: DS.attr(),
    created_at: DS.attr(),
    updated_at: DS.attr(),
    notes: DS.attr(),
    method: DS.attr(),
    purpose: DS.attr(),
    beneficiary_type: DS.attr(),
    bank_name: DS.attr(),
    bank_address: DS.attr(),
    bank_city: DS.attr(),
    bank_state_province: DS.attr(),
    bank_postal_code: DS.attr(),
    bank_country: DS.attr(),
    bank_phone: DS.attr(),
    code_swift: DS.attr(),
    code_aba: DS.attr(),
    code_irc: DS.attr(),
    company_id: DS.attr(),
    account_holder: DS.attr(),
    account_number: DS.attr(),
    account_iban: DS.attr(),
    account_holder_dob: DS.attr(),
    account_holder_address: DS.attr(),
    account_holder_city: DS.attr(),
    account_holder_state_province: DS.attr(),
    account_holder_postal_code: DS.attr(),
    account_holder_country: DS.attr(),
    account_holder_nationality: DS.attr(),
    intermediary_bank_name: DS.attr(),
    intermediary_bank_address: DS.attr(),
    intermediary_bank_city: DS.attr(),
    intermediary_bank_state_province: DS.attr(),
    intermediary_bank_postal_code: DS.attr(),
    intermediary_bank_country: DS.attr(),
    intermediary_bank_code_aba: DS.attr(),
    intermediary_bank_code_swift: DS.attr(),
    intermediary_bank_code_irc: DS.attr(),
    company: DS.belongsTo( 'company', { async: true } ),

    getName: function(){
        return this.get( 'name' ) ? this.get( 'name' ) : `${this.get( 'account_holder' )}: ${this.get( 'bank_name' )} [${this.get( 'account_number' )}]`;
    }.property( 'name', 'account_holder', 'account_number', 'bank_name' ),

    hasIntermediary: function(){
        return !!this.get( 'intermediary_bank_name' );
    }.property( 'intermediary_bank_name' ),

    strMethod: function(){
        let stringList = this.get( 'getStringList' );
        if( this.get( 'method' ) === 0 ){
            return stringList.wire;
        }
        return stringList.ach;
    }.property( 'method' ),

    strBeneficiaryType: function(){
        let stringList = this.get( 'getStringList' );
        if( this.get( 'model.wire.beneficiary_type' ) === 0 ){
            return stringList.individual;
        }
        return stringList.business;
    }.property( 'model.wire.beneficiary_type' ),
} );
