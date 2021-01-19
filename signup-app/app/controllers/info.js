import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'signup-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],
    companyBinding: 'controllers.application.model.company',
    userBinding: 'controllers.application.model.user',
    registrationBinding: 'controllers.application.model',
    dobContent: 'All Applicants must be at least 18 years old.',

    isUS: function(){
        return this.get( 'company.country' ) === 'US';
    }.property( 'company.country' ),

    tradingIsUS: function(){
        return this.get( 'company.trading_country' ) === 'US';
    }.property( 'company.trading_country' ),

    validations: {
        "company.name": {
            presence: {
                unless: 'registration.isPersonal'
            }
        },
        "company.country": {
            presence: true
        },
        "company.address": {
            presence: true
        },
        "company.city": {
            presence: true
        },
        "company.phone_office": {
            presence: {
                unless: 'registration.isPersonal'
            }
        },
        "company.state_province": {
            presence: true
        },
        "company.postal_code": {
            presence: true
        },
        "company.trading_country": {
            presence: true
        },
        "company.trading_address": {
            presence: true
        },
        "company.trading_city": {
            presence: true
        },
        "company.trading_state_province": {
            presence: true
        },
        "company.trading_postal_code": {
            presence: true
        },
        "company.website": {
            inline: EmberValidations.validator( function(){
                var website = this.model.get( 'company.website' );
                var expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;

                if( !Ember.isEmpty( website ) && !expression.test( website ) ){
                    return 'Invalid url';
                }
            } )
        },
        "company.employee_count": {
            presence: {
                unless: 'registration.isPersonal'
            }
        },
        "company.company_number": {
            presence: {
                unless: 'registration.isPersonal'
            }
        },
        "company.entity_type": {
            presence: {
                unless: 'registration.isPersonal'
            }
        },
        "company.tax_num_type": {
            presence: {
                unless: 'registration.isPersonal'
            }
        },
        "company.tax_num": {
            presence: {
                unless: 'registration.isPersonal'
            }
        },
        "user.first_name": {
            presence: true
        },
        "user.last_name": {
            presence: true
        },
        "user.date_of_birth": {
            presence: true
        },
        "user.nationality": {
            presence: true
        },
        "user.phone_mobile": {
            presence: true
        },
        "user.id_num": {
            presence: true
        },
        "user.id_type": {
            presence: true
        },
        "user.id_country": {
            presence: true
        }
    },

    employees: [
        { name: '1 - 5', val: '1 - 5' },
        { name: '6 - 25', val: '6 - 25' },
        { name: '26 - 50', val: '26 - 50' },
        { name: '51 - 100', val: '51 - 100' },
        { name: '100+', val: '100+' }
    ],

    entityTypes: [
        { name: 'Corporation', val: 'Corporation' },
        { name: 'Limited / Partnership', val: 'Limited / Partnership' },
        { name: 'Trust', val: 'Trust' },
        { name: 'Nonprofit', val: 'Nonprofit' },
        { name: 'Individual', val: 'Individual' }
    ],

    idTypes: [
        { key: 'Passport', value: 'Passport' },
        { key: 'SSN/TIN', value: 'Social Security / TIN' },
        { key: 'NID', value: 'National ID' },
        { key: 'Local ID', value: 'Provincial/State ID' }
    ],

    copyAddress: function(){
        if( this.get( 'company.trading_same' ) ){
            this.set( 'company.trading_address', this.get( 'company.address' ) );
            this.set( 'company.trading_address_2', this.get( 'company.address_2' ) );
            this.set( 'company.trading_city', this.get( 'company.city' ) );
            this.set( 'company.trading_state_province', this.get( 'company.state_province' ) );
            this.set( 'company.trading_postal_code', this.get( 'company.postal_code' ) );
            this.set( 'company.trading_country', this.get( 'company.country' ) );
        }
    },

    actions: {
        submit: function(){
            var _this = this;
            var adapter = _this.get( 'akxAdapter' );
            var registration = _this.get( 'registration' );

            _this.copyAddress();
            _this.set( 'formLocked', true );
            if( registration.get( 'isPersonal' ) ){
                registration.set( 'user.is_owner', true );
            }
            _this.validate().then( function(){
                return adapter.sendRequest( '/registrations/' + registration._id, 'put', { registration: registration } )
                    .then( function( result ){
                        registration.completeStep( 'info' );
                        return adapter.sendRequest( '/registrations/' + registration._id + '/appSteps', 'put', { appSteps: registration.appSteps } );
                    } )
                    .then( function( result ){
                        _this.set( 'validated', false );
                        _this.transitionToRoute( registration.get( 'nextStep' ) );
                    } )
                    .catch( function(){
                        _this.notify.alert( { raw: config.messages.update_error, closeAfter: null } );
                    } );

            }, function(){
            } ).finally( function(){
                _this.set( 'formLocked', false );
            } );
        }
    }
} );
