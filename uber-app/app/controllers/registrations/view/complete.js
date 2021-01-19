import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'uber-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'registrations/view', 'application' ],
    registrationBinding: 'controllers.registrations/view.model',
    validationErrorsBinding: 'controllers.registrations/view.validationErrors',
    industry: null,

    validations: {
        account_number: {
            presence: true,
            length: { is: 5 },
            numericality: { onlyInteger: true }
        }
    },

    options: [
        { name: "Telecom", val: 1 },
        { name: "Precious Metals", val: 2 },
        { name: "Construction", val: 3 },
        { name: "Commodities", val: 4 },
        { name: "Personal", val: 5 }
    ],

    currentStep: function(){
        return this.get( 'registration' ).appSteps.findBy( 'route', 'complete' );
    }.property( 'registration.appSteps' ),

    canActivate: function(){
        var validationErrors = this.get( 'validationErrors' );
        var registrationStatus = this.get( 'registration.status' );
        if( Array.isArray( validationErrors ) ){
            return validationErrors.filterBy( 'level', 0 ).length === 0 && registrationStatus === 1;
        }
        else{
            return false;
        }
        return true;
    }.property( 'model' ),

    isCompleted: function(){
        return this.get( 'registration.status' ) !== 0;
    }.property( 'registration.status' ),

    activated: function(){
        return this.get( 'registration.status' ) !== 0 && this.get( 'registration.status' ) !== 1;
    }.property( 'registration.status' ),

    industryChanged: function(){
        var self = this;
        var start = null;
        var end = null;
        switch( this.get( 'industry' ) ){
            case 1:
                start = 1700;
                end = 1999;
                break;
            case 2:
                start = 2000;
                end = 2999;
                break;
            case 3:
                start = 3000;
                end = 3999;
                break;
            case 4:
                start = 4000;
                end = 4999;
                break;
            case 5:
                start = 5000;
                end = 5999;
                break;
        }
        Ember.run( function(){
            Ember.$.ajax( {
                url: config.APP.uber_api_host + '/companies/generateAccountNumber',
                type: 'POST',
                dataType: 'json',
                data: {
                    start: start,
                    end: end
                }
            } ).then(
                function( response ){
                    self.set( 'account_number', response.account_number );
                },
                function( xhr, status, error ){
                    self.get( 'akxUtil' ).handleError( xhr, {
                        scope: self
                    } );
                    self.set( 'isLocked', false );
                }
            );
        } );

    }.observes( 'industry' ),

    actions: {
        skipStep: function( route ){
            this.get( 'controllers.registrations/view' ).send( 'skipStep', route );
        },

        revokeStep: function( route ){
            this.get( 'controllers.registrations/view' ).send( 'revokeStep', route );
        },

        completeRegistration: function(){
            var _this = this;
            var akxUtil = this.get( 'akxUtil' );
            var registration = this.get( 'registration' );
            akxUtil._sendRequest( '/signupRegistrations/' + registration._id + '/complete', 'post' ).then( function( result ){
                _this.send( 'reloadRegistrationModel' );
            }, function( result ){
            } );
        },

        reopenRegistration: function(){
            var _this = this;
            var akxUtil = this.get( 'akxUtil' );
            var registration = this.get( 'registration' );
            akxUtil._sendRequest( '/signupRegistrations/' + registration._id + '/reopen', 'post' ).then( function( result ){
                _this.send( 'reloadRegistrationModel' );
            }, function( result ){
            } );
        },

        activate: function(){
            var _this = this;
            var akxUtil = this.get( 'akxUtil' );
            var registration = this.get( 'registration' );
            var riskScore = this.get('registration.riskScore');



            this.validate().then( function(){
                    _this.set( 'isLocked', true );
                    akxUtil._sendRequest( '/signupRegistrations/' + registration._id + '/activate', 'post', { account_number: _this.get( 'account_number' ), riskScore: riskScore} ).then( function( result ){
                        _this.set( 'isLocked', false );
                        _this.transitionToRoute( 'companies.view', result.data.company.id );

                    }, function( result ){
                        if( !Ember.isEmpty( result.jqXHR.responseJSON ) &&
                            Array.isArray( result.jqXHR.responseJSON.errors ) &&
                            result.jqXHR.responseJSON.errors.length === 1 &&
                            Array.isArray( result.jqXHR.responseJSON.errors[ 0 ].account_number ) &&
                            result.jqXHR.responseJSON.errors[ 0 ].account_number.length === 1
                        ){
                            _this.notify.alert( result.jqXHR.responseJSON.errors[ 0 ].account_number[ 0 ] );
                        }
                        _this.set( 'isLocked', false );
                    } );
                },
                function(){

                }
            );
        }
    }
} );

