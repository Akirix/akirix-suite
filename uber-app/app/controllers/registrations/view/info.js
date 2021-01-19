import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'registrations/view', 'application' ],
    registrationBinding: 'controllers.registrations/view.model',
    userBinding: 'controllers.registrations/view.model.user',
    companyBinding: 'controllers.registrations/view.model.company',
    validations: {
        "user.email": {
            format: {
                with: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
                allowBlank: false,
                message: 'Please enter a valid email'
            }
        }
    },

    taxNumberType: null,

    currentStep: function(){
        return this.get( 'registration' ).appSteps.findBy( 'route', 'info' );
    }.property( 'registration.appSteps' ),

    taxNumberTypeOptions: function(){
        if( this.get( 'registration.isPersonal' ) ){
            return [
                { value: 'SSN', label: 'SSN' },
                { value: 'TIN', label: 'TIN' },
                { value: 'other', label: 'Other' }
            ];
        }
        else{
            return [
                { value: 'EIN', label: 'EIN' },
                { value: 'other', label: 'Other' }
            ];
        }
    }.property( 'registration.isPersonal' ),

    showTaxNumberType: function(){
        return this.get( 'company.country' ) === 'US';
    }.property( 'company.country' ),

    showTaxAuthorityName: function(){
        return this.get( 'taxNumberType' ) === 'other' || ( this.get( 'registration.account_type' ) === 'business' && this.get( 'company.country' ) !== 'US' );
    }.property( 'company.country', 'taxNumberType', 'registration.account_type' ),

    taxNumberDidChange: function(){
        var taxNumberType = this.get( 'taxNumberType' );
        if( taxNumberType !== 'other' ){
            this.set( 'company.tax_num_type', taxNumberType );
        }
        else{
            this.set( 'company.tax_num_type', null );
        }
    }.observes( 'taxNumberType' ),

    copyAddress: function(){
        if( this.get( 'company.trading_same' ) ){
            this.set( 'company.trading_address', this.get( 'company.address' ) );
            this.set( 'company.trading_city', this.get( 'company.city' ) );
            this.set( 'company.trading_state_province', this.get( 'company.state_province' ) );
            this.set( 'company.trading_postal_code', this.get( 'company.postal_code' ) );
            this.set( 'company.trading_country', this.get( 'company.country' ) );
        }
    },

    init: function(){
        this._super();

        var initialTaxNumberType = this.get( 'company.tax_num_type' );
        var taxNumberTypeOptions = this.get( 'taxNumberTypeOptions' );

        if( taxNumberTypeOptions.isAny( 'value', initialTaxNumberType ) ){
            this.set( 'taxNumberType', initialTaxNumberType );
        }
        else if( !Ember.isEmpty( initialTaxNumberType ) ){
            this.set( 'taxNumberType', 'other' );
        }
    },

    actions: {
        save: function(){
            var _this = this;
            var akxUtil = this.get( 'akxUtil' );
            var registration = this.get( 'registration' );

            _this.copyAddress();
            _this.validate().then( function(){
                _this.set( 'isLocked', true );
               _this.set('registration.user.date_of_birth', new Date( moment(_this.get('registration.user.date_of_birth'))));
                akxUtil._sendRequest( '/signupRegistrations/' + registration._id, 'put', { registration: registration } ).then( function( result ){
                    _this.set( 'isLocked', false );
                    _this.notify.info( 'Updated' );
                }, function(){
                    _this.set( 'isLocked', false );
                    _this.notify.alert( '' );
                } );
            }, function( errors ){
                _this.set( 'isLocked', false );
            } );
        },

        skipStep: function( route ){
            this.get( 'controllers.registrations/view' ).send( 'skipStep', route );
        },

        revokeStep: function( route ){
            this.get( 'controllers.registrations/view' ).send( 'revokeStep', route );
        }
    }
} );

