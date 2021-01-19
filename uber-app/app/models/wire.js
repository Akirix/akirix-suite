import DS from 'ember-data';
import config from 'uber-app/config/environment';

var locale = new Globalize( navigator.language );

export default DS.Model.extend( {
    parent_id: DS.attr(),
    account_id: DS.attr(),
    company_id: DS.attr(),
    wire_batch_id: DS.attr(),
    currency_id: DS.attr(),
    beneficiary_type: DS.attr( 'number' ),
    created_at: DS.attr(),
    updated_at: DS.attr(),
    name: DS.attr(),
    notes: DS.attr(),
    notes_akirix: DS.attr(),
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
    code_swift: DS.attr(),
    code_aba: DS.attr(),
    code_irc: DS.attr(),
    account_holder: DS.attr(),
    account_number: DS.attr(),
    account_holder_dob: DS.attr(),
    account_holder_nationality: DS.attr(),
    account_holder_address: DS.attr(),
    account_holder_city: DS.attr(),
    account_holder_state_province: DS.attr(),
    account_holder_postal_code: DS.attr(),
    account_holder_country: DS.attr(),
    account_iban: DS.attr(),
    confirmation: DS.attr(),
    reference: DS.attr(),
    raw_data: DS.attr(),
    first_user_id: DS.attr(),
    second_user_id: DS.attr(),
    isMine: DS.attr( 'boolean' ),
    custom_data: DS.attr(),
    bank_route_id: DS.attr(),
    preferred_account_number: DS.attr(),

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
    wireBatch: DS.belongsTo( 'wire-batch', { async: true } ),
    bankRoute: DS.belongsTo( 'bank-route', { async: true } ),
    purpose: DS.attr(),

    custom: function(){
        try{
            return JSON.parse( this.get( 'custom_data' ) )
        }
        catch( e ){
            return null;
        }
    }.property( 'custom_data' ),

    str_amount: function(){
        return locale.format( Number( this.get( 'amount' ) ), 'n2' );
    }.property( 'amount' ),

    str_method: function(){
        switch( this.get( 'method' ) ){
            case 0:
                return "Wire";
            case 1:
                return "ACH";
            case 2:
                return "Internal Transfer";
        }
    }.property( 'type' ),

    str_type: function(){
        switch( this.get( 'type' ) ){
            case 0:
                return "Withdrawal";
            case 1:
                return "Deposit";
            case 2:
                return "Internal Transfer";
        }
    }.property( 'type' ),

    str_status: function(){
        switch( this.get( 'status' ) ){
            case 0:
                return "Pending";
            case 1:
                return "Completed";
        }
    }.property( 'status' ),

    str_created_at_date: function(){
        return moment( this.get( 'created_at' ) ).format( 'MM/DD/YYYY' );
    }.property( 'created_at' ),

    str_created_at_time: function(){
        return moment( this.get( 'created_at' ) ).format( 'HH:mm:ss' );
    }.property( 'created_at' ),

    str_updated_at_date: function(){
        return moment( this.get( 'updated_at' ) ).format( 'MM/DD/YYYY' );
    }.property( 'updated_at' ),

    str_updated_at_time: function(){
        return moment( this.get( 'updated_at' ) ).format( 'HH:mm:ss' );
    }.property( 'updated_at' ),


    str_sign_color: function(){
        if( this.get( 'isDebit' ) ){
            return '<span class="text-rose">-</span>';
        }
        else{
            return '<span class="text-green">+</span>';
        }
    }.property( 'isDebit', 'str_sign' ),

    isDebit: function(){
        return this.get( 'type' ) === 0 || this.get( 'type' ) === 2;
    }.property( 'type', 'str_sign' ),

    isCredit: function(){
        return this.get( 'type' ) === 1;
    }.property( 'type', 'str_sign' ),

    isNewWire: function(){
        return this.get( 'status' ) === 0;
    }.property( 'status' ),

    isStarted: function(){
        return this.get( 'status' ) === 1;
    }.property( 'status' ),

    isOnHold: function(){
        return this.get( 'status' ) === 4;
    }.property( 'status' ),

    isDone: function(){
        return this.get( 'status' ) === 2;
    }.property( 'status' ),

    url_pdf: function(){
        return config.APP.uber_api_host + '/wires/' + this.get( 'id' ) + '/pdf';
    }.property( 'id' ),

    isACH: function(){
        return this.get( 'method' ) === 1;
    }.property( 'method' ),

    isWire: function(){
        return this.get( 'method' ) === 0;
    }.property( 'method' ),

    isPersonal: function(){
        return this.get( 'beneficiary_type' ) === 0;
    }.property( 'beneficiary_type' ),

    isNotInBatch: function(){
        return this.get( 'wire_batch_id' ) === null;
    }.property( 'wire_batch_id' ),

    isBookTransfer: function(){
        return this.get( 'type' ) === 2;
    }.property( 'type' ),
} );

