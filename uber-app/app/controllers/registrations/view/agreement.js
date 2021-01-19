import Ember from 'ember';
import EmberValidations from 'ember-validations';

export default Ember.Controller.extend( EmberValidations.Mixin, {
    needs: [ 'registrations/view', 'application' ],
    registrationBinding: 'controllers.registrations/view.model',

    currentStep: function(){
        return this.get( 'registration' ).appSteps.findBy( 'route', 'agreement' );
    }.property( 'registration.appSteps' ),

    actions: {
        skipStep: function( route ){
            this.get( 'controllers.registrations/view' ).send( 'skipStep', route );
        },
        revokeStep: function( route ){
            this.get( 'controllers.registrations/view' ).send( 'revokeStep', route );
        },
        sendEmail: function(){
            var _this = this;
            var akxUtil = this.get( 'akxUtil' );
            var registration = this.get( 'registration' );

            var verificationsTable = Ember.$( 'table.email-verifications' );
            verificationsTable.addClass( 'loading' );

            akxUtil._sendRequest( '/signupVerifications', 'post', {
                user_id: registration.user_id,
                type: 0
            } ).then( function( result ){
                _this.get( 'target' ).send( 'reloadVerificationModel' );
                verificationsTable.removeClass( 'loading' );
            } );
        },
        sendSMS: function(){
            var _this = this;
            var akxUtil = this.get( 'akxUtil' );
            var registration = this.get( 'registration' );

            var verificationsTable = Ember.$( 'table.sms-verifications' );
            verificationsTable.addClass( 'loading' );

            akxUtil._sendRequest( '/signupVerifications', 'post', {
                user_id: registration.user_id,
                type: 1
            } ).then( function( result ){
                _this.get( 'target' ).send( 'reloadVerificationModel' );
                verificationsTable.removeClass( 'loading' );
            }, function( result ){
                akxUtil.handleError( result.jqXHR );
            } );
        }
    }
} );

