import Ember from 'ember';
import EmberValidations from 'ember-validations';
import config from 'signup-app/config/environment';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'application' ],
    registrationBinding: 'controllers.application.model',
    companyBinding: 'controllers.application.model.company',
    tradingVolumeBinding: 'controllers.application.model.tradingVolume',
    inquiries: function(){
        var accountType = this.get( 'registration.account_type' );
        return this.get( 'controllers.application.model.inquiries' ).filter( function( item ){
            if( Array.isArray( item.account_types ) ){
                return item.account_types.indexOf( accountType ) !== -1;
            }
            else{
                return true;
            }
        } );
    }.property( 'controllers.application.model.inquiries' ),

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

    validations: {
        "tradingVolume.vol_in_type": {
            presence: true
        },
        "tradingVolume.vol_in_amount": {
            presence: true
        },
        "tradingVolume.vol_out_type": {
            presence: true
        },
        "tradingVolume.vol_out_amount": {
            presence: true
        }
    },

    submitted: false,

    actions: {
        submit: function(){
            var _this = this;
            _this.validate().then( function(){
                var adapter = _this.get( 'akxAdapter' );
                var registration = _this.get( 'registration' );
                var inquiries = _this.get( 'inquiries' );
                var hasEmptyAnswers = false;

                _this.set( 'submitted', true );

                inquiries.forEach( function( item ){
                    var answer = Ember.get( item, 'answer' );
                    if( item.required && Ember.isEmpty( answer ) ){
                        hasEmptyAnswers = true;
                    }
                } );

                if( hasEmptyAnswers ){
                    _this.scrollToError();
                }
                else{
                    _this.set( 'formLocked', true );
                    return adapter.sendRequest( '/registrations/' + registration._id, 'put', { registration: registration } )
                        .then( function( result ){
                            return adapter.sendRequest( '/registrations/' + registration._id + '/inquiries', 'put', { inquiries: inquiries } );
                        } )
                        .then( function( result ){
                            registration.completeStep( 'questionnaire' );
                            return adapter.sendRequest( '/registrations/' + registration._id + '/appSteps', 'put', { appSteps: registration.appSteps } );
                        } )
                        .then( function( result ){
                            _this.set( 'validated', false );
                            _this.transitionToRoute( registration.get( 'nextStep' ) );
                        } )
                        .catch( function(){
                            _this.notify.alert( { raw: config.messages.update_error, closeAfter: null } );
                        } )
                        .finally( function(){
                            _this.set( 'formLocked', false );
                        } );
                }
            }, function(){
            } ).finally( function(){
                _this.set( 'formLocked', false );
            } );
        }
    }
} );
