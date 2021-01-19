import Ember from 'ember';

export default Ember.Object.extend( {
    created: null,
    user_id: null,
    modified: null,
    status: null,
    account_type: null,
    ip: null,
    appSteps: [],
    inquiries: [],
    documents: [],
    owners: [],
    executives: [],
    appStepsSorting: [ 'order' ],
    sortedAppSteps: Ember.computed.sort( 'appSteps', 'appStepsSorting' ),

    isBusiness: function(){
        return this.get( 'account_type' ) === 'business';
    }.property( 'account_type' ),

    isPersonal: function(){
        return this.get( 'account_type' ) === 'personal';
    }.property( 'account_type' ),

    company: {
        name: null,
        address: null,
        address_2: null,
        city: null,
        state_province: null,
        postal_code: null,
        country: null,
        trading_same: null,
        trading_address: null,
        trading_address_2: null,
        trading_city: null,
        trading_postal_code: null,
        trading_state_province: null,
        trading_country: null,
        phone_office: null,
        website: null,
        duns_number: null,
        company_number: null,
        tax_num: null,
        tax_num_type: null,
        agreement: null,
        employee_count: null,
        entity_type: null
    },
    tradingVolume: {
        vol_in_type: null,
        vol_in_amount: null,
        vol_out_type: null,
        vol_out_amount: null
    },
    user: {
        first_name: null,
        last_name: null,
        phone_mobile: null,
        phone_office: null,
        id_type: null,
        id_num: null,
        is_owner: null,
        nationality: null
    },

    nextStep: function(){
        var nextStep = this.get( 'sortedAppSteps' ).findBy( 'status', 0 );
        if( !Ember.isEmpty( nextStep ) ){
            return nextStep.route;
        }
        else{
            return 'complete-final';
        }
    }.property( 'appSteps' ),

    revokeStep: function( step ){
        var _this = this;
        var stepObj = this.get( 'appSteps' ).findBy( 'route', step );
        Ember.set( stepObj, 'status', 0 );
        _this.propertyDidChange( 'appSteps' );
    },

    completeStep: function( step ){
        var _this = this;
        var stepObj = this.get( 'appSteps' ).findBy( 'route', step );
        Ember.set( stepObj, 'status', 1 );
        _this.propertyDidChange( 'appSteps' );
    }
} );
