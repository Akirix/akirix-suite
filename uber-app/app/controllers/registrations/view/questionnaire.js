import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'registrations/view', 'application' ],
    registrationBinding: 'controllers.registrations/view.model',
    tradingVolumeBinding: 'controllers.registrations/view.model.tradingVolume',

    volumeTypes: [
        { name: 'Daily', val: 'Daily' },
        { name: 'Weekly', val: 'Weekly' },
        { name: 'Monthly', val: 'Monthly' },
    ],

    volumeAmounts: [
        { name: 'Less than 10,000', val: '< 10,000' },
        { name: '10,000 - 100,000', val: '10,000 - 100,000' },
        { name: '100,000 - 250,000', val: '100,000 - 250,000' },
        { name: '250,000 - 500,000', val: '250,000 - 500,000' },
        { name: '500,000 - 1,000,000', val: '500,000 - 1,000,000' },
        { name: 'More than 1,000,000', val: '1,000,000+' },
    ],

    currentStep: function(){
        return this.get( 'registration' ).appSteps.findBy( 'route', 'questionnaire' );
    }.property( 'registration.appSteps' ),

    actions: {
        save: function(){
            var _this = this;
            var akxUtil = this.get( 'akxUtil' );
            var registration = this.get( 'registration' );

            _this.set( 'isLocked', true );
            return akxUtil._sendRequest( '/signupRegistrations/' + registration._id + '/updateInquiries', 'put', { inquiries: registration.inquiries } ).then( function(){
                return akxUtil._sendRequest( '/signupRegistrations/' + registration._id, 'put', { registration: registration } );
            } ).then( function(){
                _this.set( 'isLocked', false );
                _this.notify.info( 'Updated' );
            } ).catch( function(){
                _this.notify.alert( 'An error occured could not save registration' );
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

