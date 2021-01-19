import DS from 'ember-data';
import config from 'akx-app/config/environment';
import StringObjectMixin from 'akx-app/mixins/model-locale';

export default DS.Model.extend( StringObjectMixin, {
    account_id: DS.attr(),
    company_id: DS.attr(),
    currency_id: DS.attr(),

    created_at: DS.attr(),
    updated_at: DS.attr(),
    name: DS.attr(),
    notes: DS.attr(),
    notes_akirix: DS.attr(),
    purpose: DS.attr(),
    amount: DS.attr( 'number' ),
    fee: DS.attr( 'number' ),
    method: DS.attr( 'number' ),
    type: DS.attr( 'number' ),
    status: DS.attr( 'number' ),
    speedwire: DS.attr( 'number' ),
    bank_name: DS.attr(),
    bank_address: DS.attr(),
    bank_city: DS.attr(),
    bank_state_province: DS.attr(),
    bank_postal_code: DS.attr(),
    bank_country: DS.attr(),
    bank_phone: DS.attr(),
    beneficiary_type: DS.attr(),
    code_swift: DS.attr(),
    code_aba: DS.attr(),
    code_irc: DS.attr(),
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
    confirmation: DS.attr(),
    first_user_id: DS.attr(),
    second_user_id: DS.attr(),
    isMine: DS.attr( 'boolean' ),
    intermediary_bank_code_aba: DS.attr(),
    intermediary_bank_code_swift: DS.attr(),
    intermediary_bank_name: DS.attr(),
    intermediary_bank_address: DS.attr(),
    intermediary_bank_city: DS.attr(),
    intermediary_bank_state_province: DS.attr(),
    intermediary_bank_postal_code: DS.attr(),
    intermediary_bank_country: DS.attr(),
    currency: DS.belongsTo( 'currency', { async: true } ),
    account: DS.belongsTo( 'account', { async: true } ),
    company: DS.belongsTo( 'company', { async: true } ),

    wireStatus: function(){
        let stringList = this.get( 'getStringList' );
        switch( this.get( 'status' ) ){
            case 0:
                return `<span tabindex="0" data-toggle="tooltip" data-placement="top" title="${stringList.submitted}"><i class="akx-icon akx-offers text-primary"></i></span>`;
            case 1:
                return `<div class="icon-spin"><span tabindex="0" data-toggle="tooltip" data-placement="top" title="${stringList.processing}"><i class="akx-icon akx-pending text-primary"></i></span></div>`;
            case 2:
                return `<span tabindex="0" data-toggle="tooltip" data-placement="top" title="${stringList.cleared}"><i class="akx-icon akx-success text-success"></i></span>`;
            case 3:
                return `<span tabindex="0" data-toggle="tooltip" data-placement="top" title="${stringList.cancelled}"><i class="akx-icon akx-cancelled text-danger"></i></span>`;
            case 4:
                return `<span tabindex="0" data-toggle="tooltip" data-placement="top" title="${stringList.submitted}"><i class="akx-icon akx-offers text-primary"></i></span>`;
            case 5:
                return `<span tabindex="0" data-toggle="tooltip" data-placement="top" title="${stringList.rejected}"><i class="akx-icon akx-rejected text-danger"></i></span>`;
            case 6:
                return `<span tabindex="0" data-toggle="tooltip" data-placement="top" title="${stringList.submitted}"><i class="akx-icon akx-offers text-primary"></i></span>`;
            case 9:
                return `<span tabindex="0" data-toggle="tooltip" data-placement="top" title="${stringList.submitted}"><i class="akx-icon akx-offers text-primary"></i></span>`;
            default:
                return '';
        }
    }.property( 'status' ),

    isCredit: function(){
        return this.get( 'type' ) === 1;
    }.property( 'type' ),

    isBookTransfer: function(){
        return this.get( 'type' ) === 2;
    }.property( 'type' ),

    isNewWire: function(){
        return ( this.get( 'status' ) === 0 || this.get( 'status' ) === 4 || this.get( 'status' ) === 9 );
    }.property( 'status' ),

    canConfirm: function(){
        return this.get( 'type' ) === 0 && this.get( 'status' ) === 2;
    }.property( 'type', 'status' ),

    isDone: function(){
        return this.get( 'status' ) === 2;
    }.property( 'status' ),

    hasIntermediary: function(){
        return !!this.get( 'intermediary_bank_name' );
    }.property( 'intermediary_bank_name' ),

    urlPdf: function(){
        return config.APP.api_host + '/wires/' + this.get( 'id' ) + '/pdf';
    }.property( 'id' ),

    strMethod: function(){
        let stringList = this.get( 'getStringList' );
        switch( this.get( 'method' ) ){
            case 0:
                return stringList.wire;
            case 1:
                return stringList.ach;
            case 2:
                return stringList.internal
        }
    }.property( 'method' )
} );
